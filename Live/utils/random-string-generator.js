const randomString = require('random-string');
const generateString = (length, numeric, letters, special) => {
    let generatedString = randomString({
        length: length,
        numeric: numeric,
        letters: letters,
        special: special,
    });
    return generatedString;
};


const cardFormatter = (card) => {
    let cardNo = card.toString();
    let last4Digits = cardNo.substr(cardNo.length - 4)
    let remainingDigits = cardNo.substring(0, cardNo.length - 4)
    remainingDigits = remainingDigits.replace(/[0-9]/g, '*');
    return remainingDigits + last4Digits;
};

module.exports = {
    generateString,
    cardFormatter
};