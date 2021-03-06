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

const UUID = require('./../uuid');

function forceLogin(keycloak, ctx) {
    let host = ctx.request.hostname;
    let headerHost = ctx.request.headers.host.split(':');
    let port = headerHost[1] || '';
    let protocol = ctx.request.protocol;
    let hasQuery = ~(ctx.request.originalUrl || ctx.request.url).indexOf('?');

    let redirectUrl = protocol + '://' + host + (port === '' ? '' : ':' + port) + (ctx.request.originalUrl || ctx.request.url) + (hasQuery ? '&' : '?') + 'auth_callback=1';

    if (ctx.request.session) {
        ctx.request.session.auth_redirect_uri = redirectUrl;
    }

    let uuid = UUID();
    let loginURL = keycloak.loginUrl(uuid, redirectUrl);

    ctx.response.redirect(loginURL);
}

function simpleGuard(role, token) {
    return token.hasRole(role);
}

module.exports = function(keycloak, spec) {
    let guard;

    if (typeof spec === 'function') {
        guard = spec;
    } else if (typeof spec === 'string') {
        guard = simpleGuard.bind(undefined, spec);
    }

    return async function protect(ctx, next) {
        if (ctx.request.kauth && ctx.request.kauth.grant) {

            if (!guard || guard(ctx.request.kauth.grant.access_token, ctx)) {
                return next();
            }

            return keycloak.accessDenied(ctx, next);
        }

        if (keycloak.redirectToLogin(ctx.request)) {
            forceLogin(keycloak, ctx);
        } else {
            return keycloak.accessDenied(ctx, next);
        }
    };
};
