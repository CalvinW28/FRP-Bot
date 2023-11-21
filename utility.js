// const axios = require("axios");

const discordChannel = {
  whitelist: "1163785113620987924",
  register: "1163785113620987924",
  updateUCP: "1163785113620987924"
}

const userRoles = {
  verifyUCP: "1149293482867949599",
  acceptedStory: "1149293482867949599",
  girl: "1149293482867949599",
  influencer: "1021798816724303903",
  vip: "1149293482867949599"
}

const adminRoles = {
  volunteer: "1148602036271730768",
  helper: "1148602036271730768",
  admin: "1148602036271730768",
  moderator: "1148602036271730768",
  globalMod: "1148602036271730768",
  executiveManagement: "1148602036271730768",
  developer: "1148199170629439488",
  founder: "1148199170629439488",
}

const findRole = (member, channel) => {
  if (member.roles.cache.find(r => r.id === channel))
    return true
  else
    return false
}

const hasRole = (member, uRole) => {
  if (member.roles.cache.some(role => role.id == uRole))
    return true
  else
    return false
}

const isRoleAdmin = member => {
  if (findRole(member, adminRoles.volunteer) ||
    findRole(member, adminRoles.helper) ||
    findRole(member, adminRoles.admin) ||
    findRole(member, adminRoles.moderator) ||
    findRole(member, adminRoles.globalMod) ||
    findRole(member, adminRoles.executiveManagement) ||
    findRole(member, adminRoles.developer) ||
    findRole(member, adminRoles.founder))
    return true
  else
    return false
}

const convertTimestamp = (timestamp, fullTime=true, onlyDate=false, onlyTime=false) => {
  const date = new Date(timestamp * 1000);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const year = date.getFullYear();
  const month = months[date.getMonth()];
  const dateNumb = date.getDate();
  const hour = date.getHours();
  const min = date.getMinutes();
  const sec = date.getSeconds();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayname = days[date.getDay()];

  const formatTime = waktu => {
    if (waktu > 10) return waktu;
    else return `0${waktu}`;
  }

  let time = '';
  if (fullTime) {
    time = `${dayname}, ${formatTime(dateNumb)} ${month} ${year}, ${formatTime(hour)}:${formatTime(min)}:${formatTime(sec)}`;
  } else if (onlyDate) {
    time = `${dayname}, ${formatTime(dateNumb)} ${month} ${year}`;
  } else if (onlyTime) {
    time = `${formatTime(hour)}:${formatTime(min)}:${formatTime(sec)}`;
  }
    
  return time;
}

const trim = (str, max) => ((str.length > max) ? `${str.slice(0, max - 3)}...` : str);

// const randomQuote = async () => {
//   const api = await axios.get("https://goquotes-api.herokuapp.com/api/v1/random?count=1");
//   console.log(api.data);
//   return `*"${api.data.quotes[0].text}"*\n- **${api.data.quotes[0].author}**\nTag: **${api.data.quotes[0].tag}**`;
// }

module.exports = {
  isRoleAdmin,
  hasRole,
  findRole,
  discordChannel,
  userRoles,
  convertTimestamp,
  trim
}