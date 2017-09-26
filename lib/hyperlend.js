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
    tx.loan.fee = tx.fee;
    tx.loan.specialInterest = tx.specialInterest;

    console.log('a');

    return getAssetRegistry('ch.hslu.blc.Loan')
        .then(function (assetRegistry) {
            return assetRegistry.update(tx.loan);
        })
        .then (function () {
            return getAssetRegistry('ch.hslu.blc.LendingPool');
        });
}


/**
 * Place a Bid on a loan.
 * @param {ch.hslu.blc.PlaceBid} tx - the tx to be processed
 * @transaction
 */
function placeBid(tx) {
    console.log('X');

    if (tx.loan.bids === undefined) {
        tx.loan.bids = [];
    }
    tx.loan.bids.push(tx.bidInfo);

    var loanSum = 0;
    for (var i=0; i<tx.loan.bids.length; i++) {
        loanSum += tx.loan.bids[i].amount;
    }

    if (loanSum >= tx.loan.amount) {
        console.log('FUNDED!!!');
        tx.loan.state = 'FUNDED';
    }
    return getAssetRegistry('ch.hslu.blc.Loan')
        .then(function (assetRegistry) {
            return assetRegistry.update(tx.loan);
        });
}


/**
 * Place a Bid on a loan.
 * @param {ch.hslu.blc.EndBiddingTimed} tx - the tx to be processed
 * @transaction
 */
function endBiddingTimed(tx) {


    var factory = getFactory();

    if (tx.loan.state === 'FUNDED') {
        console.log('FUNDED!!!');
        tx.loan.state = 'ON_TIME';

        tx.loan.lendors = [];
        tx.loan.payments = [];

        var bids = tx.loan.bids;

        bids.sort((function(a,b){
            if (a.interest < b.interest) {
                return -1;
            }
            if (a.interest > b.interest) {
                return 1;
            }
            return this.indexOf(a)-this.indexOf(b);
        }).bind(bids));

        var fundedAmount = 0;

        for (var i = 0; i < bids.length; i++) {
            var bid = bids[i];
            if (fundedAmount >= tx.loan.amount) {
                break;
            } else {
                var lendor = factory.newConcept('ch.hslu.blc','LendorInfo');
                lendor.lendor= bid.lendor;
                lendor.interest = bid.interest;
                fundedAmount += bid.amount;

                if (fundedAmount > tx.loan.amount) {
                    lendor.amount = bid.amount - (fundedAmount - tx.loan.amount);
                } else {
                    lendor.amount = bid.amount;
                }
                tx.loan.lendors.push(lendor);
            }
        }
    } else {
        tx.loan.state = 'REJECTED';
    }
    return getAssetRegistry('ch.hslu.blc.Loan')
        .then(function (assetRegistry) {
            return assetRegistry.update(tx.loan);
        });
}