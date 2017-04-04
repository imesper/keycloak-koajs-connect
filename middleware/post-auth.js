/*
 * Copyright 2016 Red Hat Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
'use strict';

const URL = require('url');

module.exports = function(keycloak) {
    return async function postAuth(ctx, next) {

        if (!ctx.query.auth_callback) {
            return next();
        }

        if (ctx.query.error) {
            console.log(ctx.query.error);
            return keycloak.accessDenied(ctx, next);
        }

        try {
            const grant = await keycloak.getGrantFromCode(ctx.query.code, ctx);

            let urlParts = {
                pathname: ctx.request.path,
                query: ctx.request.query
            };

            delete urlParts.query.code;
            delete urlParts.query.auth_callback;
            delete urlParts.query.state;

            let cleanUrl = URL.format(urlParts);

            ctx.request.kauth.grant = grant;
            try {
                keycloak.authenticated(ctx.request);
            } catch (err) {
                console.log(err);
            }
            ctx.response.redirect(cleanUrl);
        } catch (e) {
            console.log(e);
        }
    };
};
