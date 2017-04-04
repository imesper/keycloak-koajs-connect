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

module.exports = function (keycloak, logoutUrl) {
  return async function logout(ctx, next) {
    if (ctx.request.url !== logoutUrl) {
      return next();
    }

    if (ctx.request.kauth.grant) {
      keycloak.deauthenticated(ctx.request);
      ctx.request.kauth.grant.unstore(ctx);
      delete ctx.request.kauth.grant;
    }

    let host = ctx.request.hostname;
    let headerHost = ctx.request.headers.host.split(':');
    let port = headerHost[1] || '';
    let redirectUrl = ctx.request.protocol + '://' + host + (port === '' ? '' : ':' + port) + '/';
    let keycloakLogoutUrl = keycloak.logoutUrl(redirectUrl);

    ctx.response.redirect(keycloakLogoutUrl);
  };
};