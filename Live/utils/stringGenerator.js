const rightpad = require('right-pad');

const formatString = (string) => {
  let nullString = '';
  if(string == '' || string == undefined){
    return  nullString;
  } else {
    let stringPrefix = string.substr(0, 3);
    let stringPostfix = string.slice(-3);
    //console.log(string+' : '+string.length);
    return rightpad(stringPrefix, (string.length - 3), '*')+stringPostfix;
  }
};

module.exports = {
  formatString,
};