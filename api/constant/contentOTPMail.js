function contentOTPMail(otp){
    var time = new Date();
    var timeExpire = new Date();
    timeExpire.setMinutes(time.getMinutes() + 2);
    var options = {
        otp: otp,
        expires: timeExpire
    };
    return options

};
module.exports = { contentOTPMail }