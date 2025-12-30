const mongoose = require('mongoose');

async function check() {
    try {
        await mongoose.connect('mongodb://localhost:27017/TackCare');
        const User = mongoose.model('User', new mongoose.Schema({ name: String, role: String }));
        const user = await User.findOne({ name: /Riya/i });
        console.log('RIYA USER:', JSON.stringify(user, null, 2));

        if (user) {
            const Doctor = mongoose.model('Doctor', new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId }));
            const doctor = await Doctor.findOne({ userId: user._id });
            console.log('RIYA DOCTOR:', JSON.stringify(doctor, null, 2));
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

check();
