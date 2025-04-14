var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const consumerConstants = require('../constants/consumer-constants');


var haribhagatschema = new Schema({
    haribhagat_id: {
        type: String,
        default: '',
        unique: true
    },
    surname: {
        type: String,
        default: ''
    },
    first_name: {
        type: String,
        default: ''
    },
    middle_name: {
        type: String,
        default: ''
    },
    is_own_home: {
        type: Boolean,
        default: true
    },
    is_verified: {
        type: Boolean,
        default: false
    },
    is_memeber_of_land_donation: {
        type: Boolean,
        default: true
    },
    is_member_of_other_donation: {
        type: Boolean,
        default: true
    },
    business_name: {
        type: String,
        default: ''
    },
    is_memeber_of_sahajanadi_sabha: {
        type: Boolean,
        default: false
    },
    total_sabha: {
        type: Boolean,
        default: true
    },
    email: {
        type: String,
        default: ''
    },
    messageSent:{
        type: Boolean,
        default: false
    },
    address: {
        type: String,
        default: ''
    },
    house_no: {
        type: String,
        default: ''
    },
    landmark: {
        type: String,
        default: ''
    },
    post_office: {
        type: String,
        default: ''
    },
    native_place: {
        type: String,
        default: ''
    },    
    area: {
        type: String,
        default: ''
    },

    district: {
        type: String,
        default: ''
    },
    
    sub_district: {
        type: String,
        default: ''
    },

    state: {
        type: String,
        default: ''
    },

    pin_code: {
        type: String,
        default: ''
    },
    
    note: {
        type: String,
        default: ''
    },

    mobile: {
        type: String,
        default: ''
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Transgender'],
        default: 'Active'
    },
    mobile_country_code: {
        type: String,
        default: ''
    },
    profile_picture: {
        type: String,
        default: ''
    },
    signup_with: {
        type: String,
        default: ''
    },
    verification_code: {
        type: String,
        default: ''
    },
    admin_id: {
        type: String,
        default: ''
    },
    device_type: {
        type: String,
        default: ''
    },
    device_name: { type: String, default: '' },
    device_token: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    passport_no: {
        type: String,
        default: ''
    },
    birth_date: {
        type: Date,
        default: null
    },
    family_id: {
        type: String,
        default: ''
    },
    number_of_family_member: {
        type: Number,
        default: 1
    },
    anniversary_date: {
        type: Date,
        default: null
    },
    is_archive: {
        type: String,
        enum: ['true', 'false'],
        default: 'false'
    },
    version_code: {
        type: String,
        default: ''
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});



// // Execute before each user.save() call
haribhagatschema.pre('save', async function(callback) {
    // const haribhagat_id = consumerConstants.consumer_initials.consumer + Math.floor(Math.random() * 8999 + 10000);
    // this.invite_code = Math.random().toString(36).substring(7);
    // this.haribhagat_id = haribhagat_id;
    // callback();
    if (!this.haribhagat_id) {
       
        if (this.gender === 'Female') {
            // For Female, start the ID from 501 and increment sequentially
            const lastFemaleRecord = await Haribhagat.findOne({ gender: 'Female' }).sort({  created_at: -1 });
            let newId = 5001; // Start from 501 for Female
            if (lastFemaleRecord) {
                // Increment the last female haribhagat_id
                newId = parseInt(lastFemaleRecord.haribhagat_id, 10) + 1;
            }
    
            this.haribhagat_id = newId.toString(); 
        } else {
            // For Male or others, follow the default logic
            const count = await Haribhagat.count();
            this.haribhagat_id = (count + 1).toString();

            if (count === 0) {
                // If there are no existing records, set haribhagat_id to 0001
                this.haribhagat_id = "1";
            } else {
                // Fetch the last inserted haribhagat_id for Male or others
                const lastMaleRecord = await Haribhagat.findOne({ gender: 'Male' }).sort({ created_at: -1 });
                lastMaleRecord
                    let newId = 1; // Start from 1 for Male
                    if (lastMaleRecord) {
                        // Increment the last male haribhagat_id
                        newId = parseInt(lastMaleRecord.haribhagat_id, 10) + 1;
                    }
                    this.haribhagat_id = newId.toString();  // Set ID without paddin
            }
        }
    }
    callback();
});

var Haribhagat = mongoose.model('Haribhagat', haribhagatschema);
module.exports = Haribhagat;

