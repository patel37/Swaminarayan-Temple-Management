const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const sabhaSchema = new Schema({
    sabha_id: {
        type:String,
        default: ''
    },
    attendees: [{
        type: String,  // Store haribhagat_id as a string
        default: ''
    }],
    admin_id: {
        type: String,
        default: ''
    },
    sabha_name: {
        type:String,
        default: ''
    },
    sabha_date: {
        type:Date,
        default: Date.now
    },
    from_time: {
        type:String,
            default:''
    },
    to_time:{
        type:String,
        default:''
    },
});

sabhaSchema.pre('save', async function(callback) {
    if (!this.admin_id) {
        const count = await Sabha.count();
        console.log("----count",count)
        this.sabha_id = (count + 1).toString(); 
        if (count === 0) {
            this.sabha_id = "1";
        } else {
            const lastRecord = await Sabha.findOne().sort({ _id: -1 });
            const lastId = lastRecord ? parseInt(lastRecord.sabha_id) : 0;
            this.sabha_id = (lastId + 1).toString();
        }
    }
    callback();
});

    console.log("------schema",sabhaSchema)
var Sabha = mongoose.model('Sabha', sabhaSchema);
module.exports = Sabha;