'use strict';

const config = require('./../config');
const logger = require('./../utils/logger');
const errors = require('./../utils/dz-errors');
const query = require('./../utils/query-creator');
const jsonResponse = require('./../utils/json-response');
const responseCodes = require('./../helpers/response-codes');
const dbConstants = require('./../constants/db-constants');
const role = require('./../models/role');
const Access_Rights = require('./../models/access-rights');
let _ = require('underscore');
let async = require('async');

/*
 * Used to create role
 * @param {requestParam} - title
 * @param {Function} done - Callback function with error, data params
 */
const createRole = function(requestParam, done) {
    query.insertSingle(dbConstants.dbSchema.roles, requestParam, function(errorCreateRole, role) {
        if (errorCreateRole) {
            logger('Error: while creating role.', errors.errorWithMessage(errorCreateRole));
            done(errors.internalServer(true), null);
            return;
        }
        query.selectWithAnd(dbConstants.dbSchema.roles, {role_id:{$ne:role.role_id}}, (error, roles) => {
            query.selectWithAnd(dbConstants.dbSchema.access_rights, {role_id:roles[0].role_id}, (error, access_rights) => {
                let columnsToUpdate=[];
                for(var i=0; i<access_rights.length; i++){
                    columnsToUpdate.push({
                        role_id:role.role_id,
                        module_title:access_rights[i].module_title,
                        module_code:access_rights[i].module_code,
                        is_view:true
                    })
                }
                query.insertMultiple(dbConstants.dbSchema.access_rights, columnsToUpdate, function(error, rights) {
                    if (error) {
                        logger('Error: while creating rights.', errors.errorWithMessage(error));
                        done(errors.internalServer(true), null);
                        return;
                    }
                    done(null, role)
                });
            });
        });
    });
};


/*
 * Used to get roles with params role_id or get all
 * @param {Function} done - Callback function with error, data params
 */
const getRoles = function(requestParam, req, done) {
    const columnsAndValues = [];
    query.selectWithAnd(dbConstants.dbSchema.roles, requestParam, (error, roles) => {
        if (error) {
            logger('Error: can not get roles', dbConstants.dbSchema.roles);
            done(errors.internalServer(true), null);
            return;
        }
        done(null, roles);
    });
};

/*
 * Used to update role by id
 * @param {roleDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const updateRole = function(requestParam, done) {
    query.updateSingle(dbConstants.dbSchema.roles, requestParam, {
        'role_id': requestParam.role_id
    }, function(errorUpdateRole, updatedRole) {
        if (errorUpdateRole) {
            logger('Error: can not update role');
            done(errorUpdateRole, null);
            return;
        }
        query.selectWithAnd(dbConstants.dbSchema.roles, requestParam, function(errorGetRole, role) {
            if (errorGetRole) {
                logger('Error: can not update role');
                done(errorGetRole, null);
                return;
            }
            done(null, role);
        });
    });
};


/*
 * Used to active role by id
 * @param {roleDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const activeRole = function(roleDetails, done) {
    let columnsToUpdate = {
        status: 'active'
    };
    query.updateMultiple(dbConstants.dbSchema.roles, columnsToUpdate, {
        'role_id': {
            $in: roleDetails
        }
    }, function(error, role) {
        if (error) {
            console.log(error);
            logger('Error: can not update role');
            done(error, null);
            return;
        }
        done(null, role);
    });
};

/*
 * Used to inactive role by id
 * @param {roleDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const inactiveRole = function(roleDetails, done) {
    let columnsToUpdate = {
        status: 'inactive'
    };
    query.updateMultiple(dbConstants.dbSchema.roles, columnsToUpdate, {
        'role_id': {
            $in: roleDetails
        }
    }, function(error, role) {
        if (error) {
            logger('Error: can not update role');
            done(error, null);
            return;
        }
        done(null, role);
    });
};

/*
 * Used to delete role by id
 * @param {roleDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const deleteRole = function(roleDetails, done) {
    query.removeMultiple(dbConstants.dbSchema.roles, {
        'role_id': {
            $in: roleDetails
        }
    }, function(error, role) {
        if (error) {
            logger('Error: can not delete role');
            done(error, null);
            return;
        }
        query.removeMultiple(dbConstants.dbSchema.access_rights, {
            'role_id': {
                $in: roleDetails
            }
        }, function(error, role) {
            done(null, role);
        });
    });
};

/*
 * Used to get roles with params role_id or get all
 * @param {Function} done - Callback function with error, data params
 */
const getAccessRight = function(requestParam, done) {
    query.selectWithAnd(dbConstants.dbSchema.access_rights, requestParam, (error, access_rights) => {
        if (error) {
            logger('Error: can not get access_rights', dbConstants.dbSchema.access_rights);
            done(errors.internalServer(true), null);
            return;
        }
        done(null, access_rights);
    });
};

/*
 * Used to get roles with params role_id or get all
 * @param {Function} done - Callback function with error, data params
 */
const getAccessRightShow = function(requestParam, done) {
    query.selectWithAnd(dbConstants.dbSchema.access_rights, requestParam, (error, access_rights) => {
        if (error) {
            logger('Error: can not get access_rights', dbConstants.dbSchema.access_rights);
            done(errors.internalServer(true), null);
            return;
        }
        let columnsAndValues={};
        for(var i=0; i<access_rights.length; i++){
            columnsAndValues[access_rights[i].module_code]=access_rights[i].is_view;
        }
        done(null, columnsAndValues);
    });
};

/*
 * Used to update role by id
 * @param {roleDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const updateAccessRight = function(requestParam, done) {
    query.selectWithAndOne(dbConstants.dbSchema.roles, {role_id:requestParam.role_id}, (error, role) => {
        if (error) {
            logger('Error: can not get role', dbConstants.dbSchema.roles);
            done(errors.internalServer(true), null);
            return;
        }
        if(role.title=='Super Administrator' || role.title=='Super Admin'){
            done(errors.customError('You can not change anything.', 403, 'Super Admin', true), null);
            return;
        }
        else{
            query.selectWithAnd(dbConstants.dbSchema.access_rights, {role_id:requestParam.role_id}, (error, rights) => {
                if (error) {
                    logger('Error: can not get access_rights', dbConstants.dbSchema.access_rights);
                    done(errors.internalServer(true), null);
                    return;
                }
                let newRights = [];
                _.each(rights, function(element, index, list) {
                    if(_.contains(requestParam.arr, element.module_code)==true){
                        element.is_view=true;
                        newRights.push(element);
                    }
                    else{
                        element.is_view=false;
                        newRights.push(element);
                    }
                });
                query.removeMultiple(dbConstants.dbSchema.access_rights, {
                    'role_id': {
                        $in: [requestParam.role_id]
                    }
                }, function(error, role) {
                    query.insertMultiple(dbConstants.dbSchema.access_rights, newRights, function(error, rights) {
                        if (error) {
                            logger('Error: while creating rights.', errors.errorWithMessage(error));
                            done(errors.internalServer(true), null);
                            return;
                        }
                        done(null, rights)
                    });
                });
            });
        }
    });
};

module.exports = {
    createRole: createRole,
    getRoles: getRoles,
    updateRole: updateRole,
    activeRole: activeRole,
    inactiveRole: inactiveRole,
    deleteRole: deleteRole,
    getAccessRight,
    getAccessRightShow,
    updateAccessRight
};