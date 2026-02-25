const transporter = require('./nodeMailer');

exports.sendMailRegisterTournament = async(data, tournament, tour) => { 
    let to_email = data.email;
    let mailOptions = { 
        from: process.env.EMAIL,
        to: to_email,
        subject: `Thông báo vận động viên ${data.full_name} đã đăng ký tham gia giải đấu ${tour.name} thành công`,
        html: `<div>
            <p>Hệ thống <strong>Special Tour</strong> thông báo <strong> ${data.full_name}</strong> đã đăng ký tham gia giải đấu với thông tin: </p>
            <ol>
                <li>Tên giải đấu: ${tour.name}</li>
                <li>Vận động viên: ${data.full_name}</li>
                <li>Email: ${data.email}</li>
                <li>Số điện thoại: ${data.phone}</li>
            </ol>
            <p>Hệ thống sẽ liên hệ thông báo về thông tin giải đấu ${tour.name} theo email này: ${process.env.EMAIL}</p> 
        </div>`,
    };
    const contentMail = await transporter.sendMail(mailOptions);
    return contentMail;
}