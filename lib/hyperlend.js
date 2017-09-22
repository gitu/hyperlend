/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

/**
 * Track the Acceptance to a pool.
 * @param {ch.hslu.blc.AcceptToPool} tx - the tx to be processed
 * @transaction
 */
function acceptToPool(tx) {
    tx.loan.pool = tx.pool;

    if (tx.pool.loans === undefined)  {
        tx.pool.loans = [];
    }
    tx.pool.loans.push(tx.loan);
    tx.loan.state = 'APPROVED';

    console.log('a');

    return getAssetRegistry('ch.hslu.blc.Loan')
        .then(function (assetRegistry) {
            return assetRegistry.update(tx.loan);
        })
        .then (function () {
            return getAssetRegistry('ch.hslu.blc.LendingPool');
        }).then (function (assetRegistry) {
            return assetRegistry.update(tx.lendingPool);
        });
}