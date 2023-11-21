const Discord = require("discord.js");
const { db, runQuery } = require("./db-config");
const server = require("./server-stats");
const sendEmail = require("./mailer");
const axios = require("axios");
const { isRoleAdmin, userRoles, discordChannel, hasRole, convertTimestamp, trim } = require("./utility");

const client = new Discord.Client();

client.on('ready', () => {
  console.log(`${client.user.tag} online!`);
  setInterval(() => {
    server.stats().then(data => {
      client.user.setPresence({
        activity: {
          name: `${data.hostname}\nGamemode: ${data.gamemode}\nPlayers: ${data.online} / ${data.maxplayers}\nVersion: ${data.rules.version}\nWebsite: ${data.rules.weburl}`
        },
        status: 'online'
      });
    }).catch(error => {
	      client.user.setPresence({
          activity: {
            name: `Error when fetching server data, error message: ${error}`,
            status: 'online'
          }
        });
        console.log(error);
    });
  }, 90000);
});

const prefix = '!';

const fetchQuery = (account, table, column) => {
  return new Promise((resolve, reject) => {
    let sql = "SELECT * FROM `"+table+"` WHERE `"+column+"` = '"+account+"'"
    runQuery(db, sql)
      .then((data) => {
        return resolve(data)
      })
      .catch(err => console.log(err))
  })
}

const checkAccount = (account) => {
  return new Promise((resolve, reject) => {
    let sql = "SELECT * FROM `accounts` WHERE `Username` = "+db.escape(account)+"";
    runQuery(db, sql)
      .then(data => {
        resolve(data);
      })
      .catch(err => console.log(err));
  })
}

const checkEmail = (email) => {
  return new Promise((resolve, reject) => {
    let sql = "SELECT * FROM `accounts` WHERE `Email` = '"+email+"'";
    runQuery(db, sql)
      .then(data => {
        resolve(data);
      })
      .catch(err => console.log(err));
  })
}

const isValidEmail = email => {
	return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email)
}

client.on('message', message => {
  const args = message.content.slice(prefix.length).trim().split(/ +/);
	const cmd = args.shift().toLowerCase();
  
  if (cmd === "whitelist") {
    if (isRoleAdmin(message.member)) {
      if (message.channel.id === discordChannel.whitelist) {
        let ucp;
        if (args[0]) ucp = `${args[0]}`;
        if (args[0] && args[1]) ucp = `${args[0]} ${args[1]}`;
        if (!args[0] && !args[1]) return message.reply('Harap isi nama ucp. !whitelist [nama ucp]');

        fetchQuery(ucp, 'accounts', 'Username')
          .then((res) => {
            if(res.length > 0) {
              const rows = JSON.parse(JSON.stringify(res[0]))
              if (rows.WhiteList == 0) {
                let query = `UPDATE accounts SET WhiteList = '1' WHERE Username = '${ucp}'`;
                runQuery(db, query)
                  .then((data) => {
                    if (data) return message.channel.send(`UCP ${ucp} berhasil ditambahkan ke white list.`);
                  })
                  .catch(msg => console.log(msg))
              } else return message.channel.send(`UCP ${ucp} sudah ada dalam whitelist!`);
            } else return message.channel.send(`UCP ${ucp} tidak ditemukan!`)
          })
          .catch(error => console.log(error))
      } else {
        message.reply('Anda tidak bisa set whitelist di channel ini.');
      }
    } else {
      message.reply("ERROR: You don't have any permission to use this command!");
    }
  } else if (cmd === "setstory") {
    if (isRoleAdmin(message.member)) {
      if (!args[0]) return message.channel.send('Harap masukkan nama character !setstory [char name]')

      fetchQuery(args[0], 'characters', 'Character')
        .then(res => {
          if(res.length > 0) {
            const rows = JSON.parse(JSON.stringify(res[0]))
            if (rows.Story == 1) return message.channel.send(`Character Story ${args[0]} sudah diaccepted`)
            else {
              let sql = "UPDATE `characters` SET `Story` = '1' WHERE `Character` = '"+args[0]+"'"
              runQuery(db, sql)
                .then(data => {
                  if (data) return message.channel.send(`Character Story ${args[0]} berhasil diaccepted`)
                })
                .catch(err => console.log(err))
            }
          } else return message.channel.send(`Character ${args[0]} tidak ditemukan!`)
        })
        .catch(error => console.log(error))  
    }
  } else if (cmd === "register") {
    if (message.channel.id !== discordChannel.register) return message.reply("ERROR: Tidak dapat menggunakan perintah itu di channel ini!");
    if (hasRole(message.member, userRoles.verifyUCP)) return message.reply("ERROR: Anda tidak dapat menggunakan perintah ini lagi, karena Anda sudah pernah mendaftarnya!");
    if (!args[0] || !args[1]) return message.reply('**USAGE: !register [ucp name] [email]**');

    // if users created date is less than 30 days, return error
    const userCreatedDate = Math.floor(message.member.user.createdTimestamp / 1000),
      now = Math.floor(Date.now() / 1000);

    if ((now - userCreatedDate) < (86400 * 7))
      return message.reply(`ERROR: Anda tidak dapat mendaftar karena akun discord anda belum beerumur 7 hari dan Akun Discord anda dibuat pada **${convertTimestamp(userCreatedDate)}**`);

    const getRandomVerifyCode = () => {
      let rand = Math.floor(Math.random() * (9999 - 1000)) + 1000;
      let code = `FRP-${rand}`;
      return code;
    }

    let registerDate = Math.floor(Date.now() / 1000);
    let verifyCode = getRandomVerifyCode();

    checkAccount(args[0]).then(res => {
      if (res.length > 0) return message.reply(`UCP **${args[0]}** sudah terdaftar di server, silahkan cari nama UCP yang lain.`);
      else {
          runQuery(db, "SELECT `DiscordID` FROM `accounts` WHERE `DiscordID` = '"+message.author.id+"'").then(user => {
              if (user.length > 0) return message.reply("ERROR: Anda tidak dapat menggunakan perintah ini lagi, karena Anda sudah pernah mendaftarnya!");
              else {
              message.author.send(`Terimakasih telah mendaftar di server kami, berikut adalah informasi akun Anda:\n
                                  UCP: ${args[0]}\n
                                  Verify Code: ${verifyCode}\n\n
              Silahkan login ke game menggunakan nama UCP yang didaftarkan untuk membuat password akun Anda serta memasukkan kode verifikasi diatas`).then(res => {
                  //console.log(`Email sent to ${args[1]}: ${res}`);
                  let sql = "INSERT INTO `accounts` (`Username`, `Password`, `Salt`, `RegisterDate`, `VerifyCode`, `WhiteList`, `DiscordID`) VALUES ('"+args[0]+"', 'None', 'None', '"+registerDate+"', '"+verifyCode+"', '1', '"+message.author.id+"')";
                  runQuery(db, sql).then(() => {
                  let role = message.guild.roles.cache.find(role => role.id == userRoles.verifyUCP);
                  message.member.roles.add(role);
                  message.member.setNickname(args[0]);
                  message.reply(`UCP **${args[0]}** berhasil didaftarkan, silahkan cek Email Anda.`);
                  
                  }).catch(err => console.log(err));
              }).catch(error => {
                  console.log(`Error sending to ${args[1]}: ${error}`);
                  // let tagUser = message.author.toString();
                  message.channel.send(`ERROR: Tidak dapat mengirimkan PM ke <@${message.author.id}>, pastikan akun discord anda tidak disable DM. Error message: ${error}`);
              });
              }
          }).catch(err => console.log(err));
      }
    }).catch(error => console.log(error));
  } else if (cmd === "updatediscorducp") {
    if (message.channel.id !== discordChannel.updateUCP) return message.reply("ERROR: Tidak dapat menggunakan perintah ini di channel ini.");
    if (!args[0]) return message.reply("**USAGE: !updatemyucp [ucp name]**");

    const getDiscordID = (ucp) => {
      return new Promise((resolve, reject) => {
        runQuery(db, "SELECT `DiscordID` FROM `accounts` WHERE `Username` = '"+ucp+"'").then(data => {
          const user = JSON.parse(JSON.stringify(data[0]));
          resolve(user);
        }).catch(err => reject(err));
      });
    }

    checkAccount(args[0]).then(res => {
      if (res.length == 0) return message.reply("ERROR: UCP tidak ditemukan.");
      else {
        getDiscordID(args[0]).then(user => {
          if (user.DiscordID == null) {
            runQuery(db, "UPDATE `accounts` SET `DiscordID` = '"+message.author.id+"' WHERE `Username` = '"+args[0]+"'").then(() => {
              message.reply(`UCP ${args[0]} berhasil dikaitkan ke Discord User ID: ${message.author.id} (<@${message.author.id}>)`);
            }).catch(error => console.log(error));
          } else return message.reply(`UCP ${args[0]} sudah dikaitkan oleh <@${user.DiscordID}>`);
        }).catch(err => console.log(err));
      }
    }).catch(err => console.log(err));
  } else if (cmd === "getuserinfo") {
    if (isRoleAdmin(message.member)) {
      if (!args[0]) return message.reply("**USAGE: !getuserinfo [ucp name]**");

      checkAccount(args[0]).then(data => {
        if (data.length == 0) return message.reply(`UCP ${args[0]} tidak ditemukan`);
        else {
          const user = JSON.parse(JSON.stringify(data[0]));
          message.channel.send(
            `
**ID:** ${user.ID}
**Username:** ${user.Username}
**Email:** ${user.Email}
**Register date:** ${convertTimestamp(user.RegisterDate)}
**Discord user ID:** ${user.DiscordID} (<@${user.DiscordID}>)
            `
          );
        }
      }).catch(error => console.log(error));
    }
  } else if (cmd === "botinfo") {
    message.channel.send("**BOT INFORMATION**\n\nVersion: **1.1.0**\nLast Updated: **March 12, 2022**\nCreated by: <@582284723905232929>\n\nCredits:\n- **discordjs** for Discord API\n- **mysqljs** Node JS Driver for MySQL\n- **JJJ4n** for SA-MP Query API\n- **nodemailer** for mailer");
  } else if (cmd === "help") {
    message.channel.send(
      "**Relived Bot Commands**\n\n`!whitelist [ucp name]` - Whitelist UCP\n`!setstory [character name]` - Set story\n`!register [ucp name] [email]` - Register UCP\n`!updatediscorducp [ucp name]` - Update Discord User ID\n`!getuserinfo [ucp name]` - Get user info\n`!botinfo` - Get bot info\n`!help` - Show this message\n`!quote` - Get random quote\n`!urban` - Search urban dictionary\n`!cat` - Get random cat image\n`!dog` - Get random dog image\n`!ping` - Pinging bot"
    );
  } else if (cmd === "quote") {
    let url = "";
    if (!args.join(" ")) {
      message.channel.send("INFO: Kamu juga dapat mencari quotes berdasarkan tags seperti: `!quote [tags]`");
      url = "https://api.quotable.io/random";
    } else {
      url = `https://api.quotable.io/random?tags=${args.join(",")}`;
    }
    try {
      axios.get(url).then(res => {
        const quote = JSON.parse(JSON.stringify(res.data));
        message.channel.send(`*"${quote.content}"* - ${quote.author}\n\nTags: **${quote.tags.join(", ")}**`);
      }).catch(() => {
        message.channel.send("ERROR: Could not find any matching quotes.");
      });
    } catch (error) {
      console.log(error);
      message.reply("Oops, something went wrong. Please try again later.");
    }
  } else if (cmd === "urban") {
    if (!args[0]) return message.reply("**USAGE: !urban [word]**");
    try {
      axios.get(`https://api.urbandictionary.com/v0/define?term=${args.join(" ")}`).then(res => {
        const data = JSON.parse(JSON.stringify(res.data));
        if (data.list.length == 0) return message.reply(`ERROR: No result found for **${args.join(" ")}**`);
        else {
          const [result] = data.list;
          const embed = new Discord.MessageEmbed()
            .setColor("#0099ff")
            .setTitle(result.word)
            .setURL(result.permalink)
            .addFields(
              { name: "Definition", value: trim(result.definition, 1024) },
              { name: "Example", value: trim(result.example, 1024) },
              { name: "Author", value: result.author },
              { name: "Rating", value: result.thumbs_up + " :thumbsup: " + result.thumbs_down + " :thumbsdown:" }
            )
            .setFooter(`${result.defid} | ${result.written_on}`);
          message.channel.send(embed);
        }
      }).catch(err => console.log(err));
    } catch (error) {
      console.log(error);
      message.reply("Oops, something went wrong. Please try again later.");
    }
  } else if (cmd === "cat") {
    try {
      axios.get("https://aws.random.cat/meow").then(res => {
        const data = JSON.parse(JSON.stringify(res.data));
        message.channel.send(data.file);
      }).catch(err => console.log(err));
    } catch (error) {
      console.log(error);
      message.reply("Oops, something went wrong. Please try again later.");
    }
  } else if (cmd === "dog") {
    try {
      axios.get("https://random.dog/woof.json").then(res => {
        const data = JSON.parse(JSON.stringify(res.data));
        message.channel.send(data.url);
      }).catch(err => console.log(err));
    } catch (error) {
      console.log(error);
      message.reply("Oops, something went wrong. Please try again later.");
    }
  } else if (cmd === "uptime") {
    let totalSeconds = (client.uptime / 1000),
      days = Math.floor(totalSeconds / 86400);
    totalSeconds %= 86400;
    let hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    let minutes = Math.floor(totalSeconds / 60),
      seconds = Math.floor(totalSeconds % 60),
      uptime = `Bot Uptime: ${days} day(s), ${hours} hour(s), ${minutes} minute(s) and ${seconds} second(s)`;
    message.channel.send(uptime);
  } else if (cmd === "ping") {
    message.channel.send("Pong!");
  }
});

client.login("");
