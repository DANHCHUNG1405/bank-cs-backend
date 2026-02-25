'use strict'
const sendMail = require('../helper/nodeMailer');


// SendMailToVerify
exports.sendMailVerify = async (host, email, token, user_name) => {
    let to_email = email;
    var url = "http://" + host + "/" + token;
    let mailOptions = {
        from: process.env.EMAIL,
        to: to_email,
        subject: 'Password help has arrived!',
        text: `Click to verify: ${url}`,
        html: `<div style="text-align: center">
     <h2 style="font-size: 24px; margin-bottom: 16px">Chào: <span style="font-weight: 600; color: #09B1BA">${email}</span> !</h2>
     <h2 style="font-size: 22px; margin-bottom: 24px">Nhấn vào đường dẫn bên dưới để xác nhận !</h2>
     <button style="padding: 10px 26px; background: #ffffff; border: 1px solid #09B1BA; border-radius:8px"><a style="text-decoration: none; color: #09B1BA; font-size: 22px; font-weight: 600" href="${url}">Xác nhận</a></button>
   </div>`
    };
    const contentMail = await sendMail(mailOptions);
    return contentMail;
};

//SendMailRegister
exports.sendMailRegisterWeb = async (host, email, token) => {   
    let to_email = email;
    var url = `${host}/register-confirm/?key=${token}`
    var mailOptions = {
      from: process.env.EMAIL,
      to: to_email,
      subject: "Registration success!",
      text: `Click to verify: ${url}`,
      html: `<div style="text-align: center">
      <h2 style="font-size: 24px; margin-bottom: 16px">Chào: <span style="font-weight: 600; color: #09B1BA">${email}</span> !</h2>
      <h2 style="font-size: 24px; margin-bottom: 16px">Chúc mừng bạn đã đăng ký tài khoản hệ thống thành công </h2>
      </div>`,
    };
    const contentMail = await sendMail(mailOptions);
    return contentMail;
  };

  exports.sendMailVerifyByOTP = async (host,email, otp, user_name) => {
    let to_email = email;
    let mailOptions = {
      from: process.env.EMAIL,
      to: to_email,
      subject: 'OTP!',
      html: `<div class=""><div class="aHl"></div><div id=":oe" tabindex="-1"></div><div id=":n7" class="ii gt" jslog="20277; u014N:xr6bB; 4:W251bGwsbnVsbCxbXV0."><div id=":n8" class="a3s aiL msg250554571991449510"><u></u>
        <div>
          <center class="m_250554571991449510wrapper">
            <div>
              <table cellpadding="0" cellspacing="0" border="0" width="100%" class="m_250554571991449510wrapper" bgcolor="#ffffff">
                <tbody><tr>
                  <td valign="top" bgcolor="#ffffff" width="100%">
                    <table width="100%" role="content-container" align="center" cellpadding="0" cellspacing="0" border="0">
                      <tbody><tr>
                        <td width="100%">
                          <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tbody><tr>
                              <td>
                                
                                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px" align="center">
                                  <tbody><tr>
                                    <td role="modules-container" style="padding:0px 0px 0px 0px;color:#000000;text-align:left" bgcolor="#ffffff" width="100%" align="left">
                                      
          <table class="m_250554571991449510preheader" role="module" border="0" cellpadding="0" cellspacing="0" width="100%" style="display:none!important;opacity:0;color:transparent;height:0;width:0">
            <tbody><tr>
              <td role="module-content">
                <p>Complete your 8x8 account activation to access all the features on our site.</p>
              </td>
            </tr>
          </tbody></table>
        <table role="module" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout:fixed">
            <tbody><tr>
              <td height="100%" valign="top">
                
      <table style="Margin:0;background:#f3f3f3!important;border-collapse:collapse;border-spacing:0;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;height:100%;line-height:1.3;margin:0;padding:0;text-align:left;vertical-align:top;width:100%">
        <tbody>
          <tr style="padding:0;text-align:left;vertical-align:top">
            <td align="center" style="Margin:0;border-collapse:collapse!important;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0;padding:0;text-align:left;vertical-align:top;word-wrap:break-word" valign="top">
            <center style="min-width:580px;width:100%">
            <table align="center" style="Margin:0 auto;background:#fefefe;border-collapse:collapse;border-spacing:0;float:none;margin:0 auto;padding:0;text-align:center;vertical-align:top;width:580px">
              <tbody>
                <tr style="padding:0;text-align:left;vertical-align:top">
                  <td style="Margin:0;border-collapse:collapse!important;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0;padding:0;text-align:left;vertical-align:top;word-wrap:break-word">
                  <table style="background:#f7f7f7;border-collapse:collapse;border-spacing:0;display:table;padding:0;text-align:left;vertical-align:top;width:100%">
                    <tbody>
                      <tr style="padding:0;text-align:left;vertical-align:top">
                        <th class="m_250554571991449510columns" style="Margin:0 auto;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0 auto;padding:0;padding-bottom:0;padding-left:16px;padding-right:16px;text-align:left;width:564px">
                        <table style="border-collapse:collapse;border-spacing:0;padding:0;text-align:left;vertical-align:top;width:100%">
                          <tbody>
                            <tr style="padding:0;text-align:left;vertical-align:top">
                              <th style="Margin:0;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0;padding:0;text-align:left">
                              <table style="border-collapse:collapse;border-spacing:0;padding:0;text-align:left;vertical-align:top;width:100%">
                                <tbody>
                                  <tr style="padding:0;text-align:left;vertical-align:top">
                                    <td height="32px" style="Margin:0;border-collapse:collapse!important;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:32px;font-weight:400;line-height:32px;margin:0;padding:0;text-align:left;vertical-align:top;word-wrap:break-word">&nbsp;</td>
                                  </tr>
                                </tbody>
                              </table>
      
                              <h4 style="Margin:0;Margin-bottom:10px;color:#909090;font-family:Helvetica,Arial,sans-serif;font-size:24px;font-weight:400;line-height:1.3;margin:0;margin-bottom:10px;padding:0;text-align:center;word-wrap:normal"><span style="float:left;display:inline;text-align:left"></span></h4>
      
                              <table style="border-collapse:collapse;border-spacing:0;padding:0;text-align:left;vertical-align:top;width:100%">
                                <tbody>
                                  <tr style="padding:0;text-align:left;vertical-align:top">
                                    <td height="16px" style="Margin:0;border-collapse:collapse!important;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:16px;margin:0;padding:0;text-align:left;vertical-align:top;word-wrap:break-word">&nbsp;</td>
                                  </tr>
                                </tbody>
                              </table>
                              </th>
                              <th style="Margin:0;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0;padding:0!important;text-align:left;width:0">&nbsp;</th>
                            </tr>
                          </tbody>
                        </table>
                        </th>
                      </tr>
                    </tbody>
                  </table>
                    </td></tr></tbody><tbody>
                      <tr style="padding:0;text-align:left;vertical-align:top">
                        <th class="m_250554571991449510columns" style="Margin:0 auto;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0 auto;padding:0;padding-bottom:16px;padding-left:16px;padding-right:16px;text-align:left;width:564px">
                        <table style="border-collapse:collapse;border-spacing:0;padding:0;text-align:left;vertical-align:top;width:100%">
                          <tbody>
                            <tr style="padding:0;text-align:left;vertical-align:top">
                              <th style="Margin:0;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0;padding:0;text-align:left">
                              <table style="border-collapse:collapse;border-spacing:0;padding:0;text-align:left;vertical-align:top;width:100%">
                                <tbody>
                                  <tr style="padding:0;text-align:left;vertical-align:top">
                                    <td height="32px" style="Margin:0;border-collapse:collapse!important;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:32px;font-weight:400;line-height:32px;margin:0;padding:0;text-align:left;vertical-align:top;word-wrap:break-word">&nbsp;</td>
                                  </tr>
                                </tbody>
                              </table>
      
                              <h4 style="Margin:0;Margin-bottom:10px;color:#909090;font-family:Helvetica,Arial,sans-serif;font-size:24px;font-weight:400;line-height:1.3;margin:0;margin-bottom:10px;padding:0;text-align:center;word-wrap:normal">Account Activation</h4>
      
                              <table style="color:rgb(51,51,51);font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;text-align:left;vertical-align:top;width:100%">
                                <tbody>
                                  <tr style="vertical-align:top">
                                    <td height="16px" style="font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:16px;vertical-align:top;border-collapse:collapse!important">&nbsp;</td>
                                  </tr>
                                </tbody>
                              </table>
      
                              <p style="Margin:0;Margin-bottom:10px;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0;margin-bottom:10px;padding:0;text-align:left">Hi there,</p>
      
                              <p style="Margin:0;Margin-bottom:10px;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0;margin-bottom:10px;padding:0;text-align:left">You&nbsp;started a registration process for an account with us using the following email address:</p>
      
                              <p style="Margin:0;Margin-bottom:10px;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0;margin-bottom:10px;padding:0;text-align:left"><strong><a href="mailto:${email}" target="_blank">${email}</a></strong></p>
      
                              <table style="border-collapse:collapse;border-spacing:0;padding:0;text-align:left;vertical-align:top;width:100%">
                                <tbody>
                                  <tr style="padding:0;text-align:left;vertical-align:top">
                                    <td height="16px" style="Margin:0;border-collapse:collapse!important;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:16px;margin:0;padding:0;text-align:left;vertical-align:top;word-wrap:break-word">&nbsp;</td>
                                  </tr>
                                </tbody>
                              </table>
      
                              <p style="Margin:0;Margin-bottom:10px;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0;margin-bottom:10px;padding:0;text-align:left">To complete your account registration&nbsp;and access all the features on our site, please activate your account by get the code below.</p>
      
                              <table style="border-collapse:collapse;border-spacing:0;padding:0;text-align:left;vertical-align:top;width:100%">
                                <tbody>
                                  <tr style="padding:0;text-align:left;vertical-align:top">
                                    <td height="16px" style="Margin:0;border-collapse:collapse!important;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:16px;margin:0;padding:0;text-align:left;vertical-align:top;word-wrap:break-word">&nbsp;</td>
                                  </tr>
                                </tbody>
                              </table>
      
                              <table style="Margin:0 0 16px 0;border-collapse:collapse;border-spacing:0;margin:0 0 16px 0;padding:0;text-align:left;vertical-align:top;width:auto">
                                <tbody>
                                  <tr style="padding:0;text-align:left;vertical-align:top">
                                    <td style="Margin:0;border-collapse:collapse!important;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0;padding:0;text-align:left;vertical-align:top;word-wrap:break-word">
                                    <table style="border-collapse:collapse;border-spacing:0;padding:0;text-align:left;vertical-align:top;width:100%">
                                      <tbody>
                                        <tr style="padding:0;text-align:left;vertical-align:top">
                                          <td style="background:rgb(203,34,51);border:none;border-radius:0px;color:rgb(254,254,254);font-family:Helvetica,Arial,sans-serif;font-size:20px;font-weight:400;position:justify;line-height:1.3;margin:0px 800px;padding:0px 0px;vertical-align:top">${otp}</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
      
                              <table style="border-collapse:collapse;border-spacing:0;padding:0;text-align:left;vertical-align:top;width:100%">
                                <tbody>
                                  <tr style="padding:0;text-align:left;vertical-align:top">
                                    <td height="16px" style="Margin:0;border-collapse:collapse!important;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:16px;margin:0;padding:0;text-align:left;vertical-align:top;word-wrap:break-word">&nbsp;</td>
                                  </tr>
                                </tbody>
                              </table>
      
                              <p style="Margin:0;Margin-bottom:10px;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0;margin-bottom:10px;padding:0;text-align:left">If you have any queries,&nbsp;please drop us an email at&nbsp;<a href="mailto:hello-cpaas@8x8.com" style="Margin:0;color:#cb2233;font-family:Helvetica,Arial,sans-serif;font-weight:400;line-height:1.3;margin:0;padding:0;text-align:left;text-decoration:none" target="_blank">smiletechcorp2018@gmail.com</a>.</p>
      
                              <table style="border-collapse:collapse;border-spacing:0;padding:0;text-align:left;vertical-align:top;width:100%">
                                <tbody>
                                  <tr style="padding:0;text-align:left;vertical-align:top">
                                    <td height="16px" style="Margin:0;border-collapse:collapse!important;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:16px;margin:0;padding:0;text-align:left;vertical-align:top;word-wrap:break-word">&nbsp;</td>
                                  </tr>
                                </tbody>
                              </table>
      
                              <p style="Margin:0;Margin-bottom:10px;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0;margin-bottom:10px;padding:0;text-align:left">Best regards,<br>Smiletech</p>
      
                              <table style="border-collapse:collapse;border-spacing:0;padding:0;text-align:left;vertical-align:top;width:100%">
                                <tbody>
                                  <tr style="padding:0;text-align:left;vertical-align:top">
                                    <td height="16px" style="Margin:0;border-collapse:collapse!important;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:16px;margin:0;padding:0;text-align:left;vertical-align:top;word-wrap:break-word">&nbsp;</td>
                                  </tr>
                                </tbody>
                              </table>
      
                              <hr>
                              <p style="Margin:0;Margin-bottom:10px;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0;margin-bottom:10px;padding:0;text-align:center"><small style="color:#cacaca;font-size:80%">If you did not sign up with us, please ignore this email</small></p>
                              </th>
                              <th style="Margin:0;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0;padding:0!important;text-align:left;width:0">&nbsp;</th>
                            </tr>
                          </tbody>
                        </table>
                        </th>
                      </tr>
                    </tbody>
                  </table>
      
                  <table style="border-collapse:collapse;border-spacing:0;padding:0;text-align:left;vertical-align:top;width:100%">
                    <tbody>
                      <tr style="padding:0;text-align:left;vertical-align:top">
                        <td height="32px" style="Margin:0;border-collapse:collapse!important;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:32px;font-weight:400;line-height:32px;margin:0;padding:0;text-align:left;vertical-align:top;word-wrap:break-word">&nbsp;</td>
                      </tr>
                    </tbody>
                  </table>
                  </center></td>
                </tr>
              </tbody>
            </table>
      
            <table style="border-collapse:collapse;border-spacing:0;padding:0;text-align:left;vertical-align:top;width:100%">
              <tbody>
                <tr style="padding:0;text-align:left;vertical-align:top">
                  <td height="16px" style="Margin:0;border-collapse:collapse!important;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:16px;margin:0;padding:0;text-align:left;vertical-align:top;word-wrap:break-word">&nbsp;</td>
                </tr>
              </tbody>
            </table>
              </td>
            </tr>
          </tbody></table>
                                    </td>
                                  </tr>
                                </tbody></table>
                                
                              </td>
                            </tr>
                          </tbody></table>
                        </td>
                      </tr>
                    </tbody></table>
                  </td>
                </tr>
              </tbody></table>
            </div>
          </center>
    </div></div></div><div id=":oa" class="ii gt" style="display:none"><div id=":o9" class="a3s aiL "></div></div><div class="hi"></div></div>`
    };
    const contentMail = await sendMail(mailOptions);
    return contentMail;
  };
  exports.sendMailVerifyByOTPActive = async (host, email, otp, user_name) => {
    let to_email = email;
    let mailOptions = {
      from: process.env.EMAIL,
      to: to_email,
      subject: 'Account activation email!',
      html: `<div class=""><div class="aHl"></div><div id=":oe" tabindex="-1"></div><div id=":n7" class="ii gt" jslog="20277; u014N:xr6bB; 4:W251bGwsbnVsbCxbXV0."><div id=":n8" class="a3s aiL msg250554571991449510"><u></u>
      <div>
        <center class="m_250554571991449510wrapper">
          <div>
            <table cellpadding="0" cellspacing="0" border="0" width="100%" class="m_250554571991449510wrapper" bgcolor="#ffffff">
              <tbody><tr>
                <td valign="top" bgcolor="#ffffff" width="100%">
                  <table width="100%" role="content-container" align="center" cellpadding="0" cellspacing="0" border="0">
                    <tbody><tr>
                      <td width="100%">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tbody><tr>
                            <td>
                              
                              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px" align="center">
                                <tbody><tr>
                                  <td role="modules-container" style="padding:0px 0px 0px 0px;color:#000000;text-align:left" bgcolor="#ffffff" width="100%" align="left">
                                    
        <table class="m_250554571991449510preheader" role="module" border="0" cellpadding="0" cellspacing="0" width="100%" style="display:none!important;opacity:0;color:transparent;height:0;width:0">
          <tbody><tr>
            <td role="module-content">
              <p>Complete your 8x8 account activation to access all the features on our site.</p>
            </td>
          </tr>
        </tbody></table>
      <table role="module" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout:fixed">
          <tbody><tr>
            <td height="100%" valign="top">
              
    <table style="Margin:0;background:#f3f3f3!important;border-collapse:collapse;border-spacing:0;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;height:100%;line-height:1.3;margin:0;padding:0;text-align:left;vertical-align:top;width:100%">
      <tbody>
        <tr style="padding:0;text-align:left;vertical-align:top">
          <td align="center" style="Margin:0;border-collapse:collapse!important;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0;padding:0;text-align:left;vertical-align:top;word-wrap:break-word" valign="top">
          <center style="min-width:580px;width:100%">
          <table align="center" style="Margin:0 auto;background:#fefefe;border-collapse:collapse;border-spacing:0;float:none;margin:0 auto;padding:0;text-align:center;vertical-align:top;width:580px">
            <tbody>
              <tr style="padding:0;text-align:left;vertical-align:top">
                <td style="Margin:0;border-collapse:collapse!important;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0;padding:0;text-align:left;vertical-align:top;word-wrap:break-word">
                <table style="background:#f7f7f7;border-collapse:collapse;border-spacing:0;display:table;padding:0;text-align:left;vertical-align:top;width:100%">
                  <tbody>
                    <tr style="padding:0;text-align:left;vertical-align:top">
                      <th class="m_250554571991449510columns" style="Margin:0 auto;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0 auto;padding:0;padding-bottom:0;padding-left:16px;padding-right:16px;text-align:left;width:564px">
                      <table style="border-collapse:collapse;border-spacing:0;padding:0;text-align:left;vertical-align:top;width:100%">
                        <tbody>
                          <tr style="padding:0;text-align:left;vertical-align:top">
                            <th style="Margin:0;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0;padding:0;text-align:left">
                            <table style="border-collapse:collapse;border-spacing:0;padding:0;text-align:left;vertical-align:top;width:100%">
                              <tbody>
                                <tr style="padding:0;text-align:left;vertical-align:top">
                                  <td height="32px" style="Margin:0;border-collapse:collapse!important;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:32px;font-weight:400;line-height:32px;margin:0;padding:0;text-align:left;vertical-align:top;word-wrap:break-word">&nbsp;</td>
                                </tr>
                              </tbody>
                            </table>
    
                            <h4 style="Margin:0;Margin-bottom:10px;color:#909090;font-family:Helvetica,Arial,sans-serif;font-size:24px;font-weight:400;line-height:1.3;margin:0;margin-bottom:10px;padding:0;text-align:center;word-wrap:normal"><span style="float:left;display:inline;text-align:left"></span></h4>
    
                            <table style="border-collapse:collapse;border-spacing:0;padding:0;text-align:left;vertical-align:top;width:100%">
                              <tbody>
                                <tr style="padding:0;text-align:left;vertical-align:top">
                                  <td height="16px" style="Margin:0;border-collapse:collapse!important;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:16px;margin:0;padding:0;text-align:left;vertical-align:top;word-wrap:break-word">&nbsp;</td>
                                </tr>
                              </tbody>
                            </table>
                            </th>
                            <th style="Margin:0;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0;padding:0!important;text-align:left;width:0">&nbsp;</th>
                          </tr>
                        </tbody>
                      </table>
                      </th>
                    </tr>
                  </tbody>
                </table>
                  </td></tr></tbody><tbody>
                    <tr style="padding:0;text-align:left;vertical-align:top">
                      <th class="m_250554571991449510columns" style="Margin:0 auto;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0 auto;padding:0;padding-bottom:16px;padding-left:16px;padding-right:16px;text-align:left;width:564px">
                      <table style="border-collapse:collapse;border-spacing:0;padding:0;text-align:left;vertical-align:top;width:100%">
                        <tbody>
                          <tr style="padding:0;text-align:left;vertical-align:top">
                            <th style="Margin:0;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0;padding:0;text-align:left">
                            <table style="border-collapse:collapse;border-spacing:0;padding:0;text-align:left;vertical-align:top;width:100%">
                              <tbody>
                                <tr style="padding:0;text-align:left;vertical-align:top">
                                  <td height="32px" style="Margin:0;border-collapse:collapse!important;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:32px;font-weight:400;line-height:32px;margin:0;padding:0;text-align:left;vertical-align:top;word-wrap:break-word">&nbsp;</td>
                                </tr>
                              </tbody>
                            </table>
    
                            <h4 style="Margin:0;Margin-bottom:10px;color:#909090;font-family:Helvetica,Arial,sans-serif;font-size:24px;font-weight:400;line-height:1.3;margin:0;margin-bottom:10px;padding:0;text-align:center;word-wrap:normal">Account Activation</h4>
    
                            <table style="color:rgb(51,51,51);font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;text-align:left;vertical-align:top;width:100%">
                              <tbody>
                                <tr style="vertical-align:top">
                                  <td height="16px" style="font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:16px;vertical-align:top;border-collapse:collapse!important">&nbsp;</td>
                                </tr>
                              </tbody>
                            </table>
    
                            <p style="Margin:0;Margin-bottom:10px;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0;margin-bottom:10px;padding:0;text-align:left">Hi there,</p>
    
                            <p style="Margin:0;Margin-bottom:10px;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0;margin-bottom:10px;padding:0;text-align:left">You&nbsp;started a registration process for an account with us using the following email address:</p>
    
                            <p style="Margin:0;Margin-bottom:10px;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0;margin-bottom:10px;padding:0;text-align:left"><strong><a href="mailto:${email}" target="_blank">${email}</a></strong></p>
    
                            <table style="border-collapse:collapse;border-spacing:0;padding:0;text-align:left;vertical-align:top;width:100%">
                              <tbody>
                                <tr style="padding:0;text-align:left;vertical-align:top">
                                  <td height="16px" style="Margin:0;border-collapse:collapse!important;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:16px;margin:0;padding:0;text-align:left;vertical-align:top;word-wrap:break-word">&nbsp;</td>
                                </tr>
                              </tbody>
                            </table>
    
                            <p style="Margin:0;Margin-bottom:10px;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0;margin-bottom:10px;padding:0;text-align:left">To complete your account registration&nbsp;and access all the features on our site, please activate your account by get the code below.</p>
    
                            <table style="border-collapse:collapse;border-spacing:0;padding:0;text-align:left;vertical-align:top;width:100%">
                              <tbody>
                                <tr style="padding:0;text-align:left;vertical-align:top">
                                  <td height="16px" style="Margin:0;border-collapse:collapse!important;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:16px;margin:0;padding:0;text-align:left;vertical-align:top;word-wrap:break-word">&nbsp;</td>
                                </tr>
                              </tbody>
                            </table>
    
                            <table style="Margin:0 0 16px 0;border-collapse:collapse;border-spacing:0;margin:0 0 16px 0;padding:0;text-align:left;vertical-align:top;width:auto">
                              <tbody>
                                <tr style="padding:0;text-align:left;vertical-align:top">
                                  <td style="Margin:0;border-collapse:collapse!important;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0;padding:0;text-align:left;vertical-align:top;word-wrap:break-word">
                                  <table style="border-collapse:collapse;border-spacing:0;padding:0;text-align:left;vertical-align:top;width:100%">
                                    <tbody>
                                      <tr style="padding:0;text-align:left;vertical-align:top">
                                        <td style="background:rgb(203,34,51);border:none;border-radius:0px;color:rgb(254,254,254);font-family:Helvetica,Arial,sans-serif;font-size:20px;font-weight:400;position:justify;line-height:1.3;margin:0px 800px;padding:0px 0px;vertical-align:top">${otp}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
    
                            <table style="border-collapse:collapse;border-spacing:0;padding:0;text-align:left;vertical-align:top;width:100%">
                              <tbody>
                                <tr style="padding:0;text-align:left;vertical-align:top">
                                  <td height="16px" style="Margin:0;border-collapse:collapse!important;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:16px;margin:0;padding:0;text-align:left;vertical-align:top;word-wrap:break-word">&nbsp;</td>
                                </tr>
                              </tbody>
                            </table>
    
                            <p style="Margin:0;Margin-bottom:10px;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0;margin-bottom:10px;padding:0;text-align:left">If you have any queries,&nbsp;please drop us an email at&nbsp;<a href="mailto:hello-cpaas@8x8.com" style="Margin:0;color:#cb2233;font-family:Helvetica,Arial,sans-serif;font-weight:400;line-height:1.3;margin:0;padding:0;text-align:left;text-decoration:none" target="_blank">smiletechcorp2018@gmail.com</a>.</p>
    
                            <table style="border-collapse:collapse;border-spacing:0;padding:0;text-align:left;vertical-align:top;width:100%">
                              <tbody>
                                <tr style="padding:0;text-align:left;vertical-align:top">
                                  <td height="16px" style="Margin:0;border-collapse:collapse!important;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:16px;margin:0;padding:0;text-align:left;vertical-align:top;word-wrap:break-word">&nbsp;</td>
                                </tr>
                              </tbody>
                            </table>
    
                            <p style="Margin:0;Margin-bottom:10px;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0;margin-bottom:10px;padding:0;text-align:left">Best regards,<br>Smiletech</p>
    
                            <table style="border-collapse:collapse;border-spacing:0;padding:0;text-align:left;vertical-align:top;width:100%">
                              <tbody>
                                <tr style="padding:0;text-align:left;vertical-align:top">
                                  <td height="16px" style="Margin:0;border-collapse:collapse!important;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:16px;margin:0;padding:0;text-align:left;vertical-align:top;word-wrap:break-word">&nbsp;</td>
                                </tr>
                              </tbody>
                            </table>
    
                            <hr>
                            <p style="Margin:0;Margin-bottom:10px;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0;margin-bottom:10px;padding:0;text-align:center"><small style="color:#cacaca;font-size:80%">If you did not sign up with us, please ignore this email</small></p>
                            </th>
                            <th style="Margin:0;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0;padding:0!important;text-align:left;width:0">&nbsp;</th>
                          </tr>
                        </tbody>
                      </table>
                      </th>
                    </tr>
                  </tbody>
                </table>
    
                <table style="border-collapse:collapse;border-spacing:0;padding:0;text-align:left;vertical-align:top;width:100%">
                  <tbody>
                    <tr style="padding:0;text-align:left;vertical-align:top">
                      <td height="32px" style="Margin:0;border-collapse:collapse!important;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:32px;font-weight:400;line-height:32px;margin:0;padding:0;text-align:left;vertical-align:top;word-wrap:break-word">&nbsp;</td>
                    </tr>
                  </tbody>
                </table>
                </center></td>
              </tr>
            </tbody>
          </table>
    
          <table style="border-collapse:collapse;border-spacing:0;padding:0;text-align:left;vertical-align:top;width:100%">
            <tbody>
              <tr style="padding:0;text-align:left;vertical-align:top">
                <td height="16px" style="Margin:0;border-collapse:collapse!important;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:16px;margin:0;padding:0;text-align:left;vertical-align:top;word-wrap:break-word">&nbsp;</td>
              </tr>
            </tbody>
          </table>
            </td>
          </tr>
        </tbody></table>
                                  </td>
                                </tr>
                              </tbody></table>
                              
                            </td>
                          </tr>
                        </tbody></table>
                      </td>
                    </tr>
                  </tbody></table>
                </td>
              </tr>
            </tbody></table>
          </div>
        </center>
  </div></div></div><div id=":oa" class="ii gt" style="display:none"><div id=":o9" class="a3s aiL "></div></div><div class="hi"></div></div>`
    };
    const contentMail = await sendMail(mailOptions);
    return contentMail;
  };
  
  
