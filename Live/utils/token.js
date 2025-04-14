const config = require('./../config');
const jwt = require('jsonwebtoken');
let strongToken = 'GPJL^xrE.F^v]2!4';
const query = require('./query-creator');
const jsonResponse = require('./json-response');
const errors = require('./dz-errors');
const dbConstants = require('./../constants/db-constants');
const to = require("await-to-js").default;
const tokenHandler = ('./../model_handlers/token-handler')
const adminConstants = require('./../constants/admin-constants');
const logger = require('./logger');

const fetchToken = (req) => {
   
    console.log("--------------Authorization-----------", req.headers['x-access-token'] , req.headers['authorization'] , req.headers['x-api-key'])
    if (!req.headers['x-access-token'] || req.headers['authorization'] && req.headers['x-api-key']) {
        console.log("--------------objt-----------", req.headers['authorization'])
        let objt = {
            code:404
        }
        return objt 
    }
    let token = req.headers['x-access-token'] || req.headers['authorization'];
    let userId = req.headers['x-api-key'];
    console.log(token)
    console.log(userId)
    if (token && token.startsWith('Bearer ')) {
        token = token.slice(7, token.length);
    }
    let obj = {
        token:token,
        userId:userId
    }
    return obj;
};

const verifyToken = (requestParam) => {
    console.log("verify token",requestParam)
    return new Promise(async(resolve, reject) => {
        if (requestParam.token.code) {
           resolve(404)
        }
        else if (requestParam.token.token) {
            jwt.verify(requestParam.token.token, strongToken,async(error, decoded)=> {

                console.log("decoded")
                console.log(decoded)
                // let error1, error2, admin, consumer;
                // [error1, admin] = await to(checkStatusAndIsExists(dbConstants.dbSchema.admins, {
                //     admin_id: decoded.id
                // }, {}));
                // // console.log("111",admin)
                // [error2, consumer] = await to(checkStatusAndIsExists(dbConstants.dbSchema.haribhagats, {
                //     haribhagat_id: decoded.id
                // }, {}))
                // console.log("2222",consumer)
                // if (error1 && error2) {
                //     console.log(error2)
                //      console.log(error1)
                //     resolve(509)
                //     return;
                // }
                const isAdmin = requestParam.token.userId.startsWith(adminConstants.admin_initials.admin)
                if(error)
                {
                    console.log("error.name", error.name)
                    if (error.name == 'TokenExpiredError') {
                        if (!isAdmin) {
                            var ref = config.firebase.userRef.child(requestParam.token.userId);
                            ref.once("value")
                                .then(function (snapshot) {
                                    if (snapshot.exists()) {
                                        ref.update({
                                            status: "token expired",
                                            user_deviceID: ""
                                        });
                                    }
                                });  
                            resolve(412)
                            return
                        } else {
                            resolve(412)
                            return
                        }
                        
                        
                    }
                    if ( error.name == 'JsonWebTokenError'){
                        console.log("1111")
                        resolve(509)
                        return
                    }

                }
                // console.log("decode",decoded.id)
                // console.log("userId",requestParam.token.userId)
                if(decoded.id == requestParam.token.userId || decoded.id == config.ADMIN_ID){
                    resolve(200)
                    return
                }else{
                    console.log("2222")
                    resolve(509)
                    return
                }

                // resolve((error) ? ((error.name == 'TokenExpiredError' || error.name == 'JsonWebTokenError') ? 412 : 509) : if(decoded.id == requestParam.token.user_id));
            });

        } else {
            resolve(509);
        }
    });
};

const generateToken = (requestParam) => {
    // console.log(requestParam)
    let n = requestParam.user_id.startsWith(adminConstants.admin_initials.admin)
    let expireTime = '90d'
    if(n){
        expireTime = '90d'
    }
    let token = jwt.sign({
        id: requestParam.user_id
    }, strongToken, {
        /*expiresIn: '1h',*/
        expiresIn: expireTime,
    });
    console.log(expireTime)
    return token;
};

const verifyAuthToken = async(req, res, next) => {
    let tokenCode = await verifyToken({
        token: fetchToken(req)
    });
    console.log("token code: " + tokenCode)
    if (tokenCode == '200') {
        next();
    } else {
        let token = jwt.sign({
            id: req.body.user_id
        }, strongToken, {
            expiresIn: '90d',
        });
        let json = {
            "error": {
                "access_token": token,
                "message": "Invalid Token",
                "code": 501
            },
            "payload": null,
            "status": "501"
        }
        res.json(json);
    }
};

const checkStatusAndIsExists = (collection, matchColumnAndValues, selectColumnAndValues) => {
    return new Promise((resolve, reject) => {
        query.selectWithAndOne(collection, matchColumnAndValues, (error, response) => {
            if (error) {
                logger('Error : Can not get')
                reject(errors.internalServer(true))
                return
            }
            if (!response) {
                logger('Error: resource not found')
                reject(errors.resourceNotFound(true))
                return
            }
            if (response.status == 'inactive') {
                logger('Error: user not found')
                reject(errors.notActivate(true))
                return
            } else {
                resolve(response)
                return;
            }

        })
    })
}
module.exports = {
    fetchToken,
    verifyToken,
    generateToken,
    verifyAuthToken,
    checkStatusAndIsExists
};