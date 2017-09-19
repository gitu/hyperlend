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

const AdminConnection = require('composer-admin').AdminConnection;
const BrowserFS = require('browserfs/dist/node/index');
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const path = require('path');

require('chai').should();

const bfs_fs = BrowserFS.BFSRequire('fs');
const NS = 'ch.hslu.blc';

describe('Hyperlend', () => {

    // let adminConnection;
    let businessNetworkConnection;

    before(() => {
        BrowserFS.initialize(new BrowserFS.FileSystem.InMemory());
        const adminConnection = new AdminConnection({ fs: bfs_fs });
        return adminConnection.createProfile('defaultProfile', {
            type: 'embedded'
        })
            .then(() => {
                return adminConnection.connect('defaultProfile', 'admin', 'adminpw');
            })
            .then(() => {
                return BusinessNetworkDefinition.fromDirectory(path.resolve(__dirname, '..'));
            })
            .then((businessNetworkDefinition) => {
                return adminConnection.deploy(businessNetworkDefinition);
            })
            .then(() => {
                businessNetworkConnection = new BusinessNetworkConnection({ fs: bfs_fs });
                return businessNetworkConnection.connect('defaultProfile', 'hyperlend', 'admin', 'adminpw');
            });
    });

    describe('#acceptLoan', () => {

        it('should be able to accept a loan', async () => {
            const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

            const dan = factory.newResource(NS, 'NaturalPerson', 'dan@email.com');
            dan.firstName = 'Dan';
            dan.lastName = 'Selman';
            dan.balance = 0;

            const simon = factory.newResource(NS, 'NaturalPerson', 'simon@email.com');
            simon.firstName = 'Simon';
            simon.lastName = 'Stone';
            simon.balance = 0;


            const fritz = factory.newResource(NS, 'NaturalPerson', 'fritz@email.com');
            fritz.firstName = 'Fritz';
            fritz.lastName = 'Fischer';
            fritz.balance = 0;

            const pool = factory.newResource(NS, 'LendingPool', 'pool1');
            pool.owner = factory.newRelationship(NS, 'NaturalPerson', fritz.$identifier);
            pool.loans = [];

            const loan = factory.newResource(NS, 'Loan', 'L1');
            loan.state = 'REQUESTED';
            loan.amount = 1000;
            loan.owner = factory.newRelationship(NS, 'NaturalPerson', simon.$identifier);

            const accept = factory.newTransaction(NS, 'AcceptToPool');
            accept.loan = factory.newRelationship(NS, 'Loan', loan.$identifier);
            accept.pool = factory.newRelationship(NS, 'LendingPool', pool.$identifier);
            accept.specialInterest = 0.05;
            accept.fee = 0.005;

            accept.pool.$identifier.should.equal(pool.$identifier);

            let loanRegistry = await businessNetworkConnection.getAssetRegistry(NS + '.Loan');
            await loanRegistry.add(loan);

            let poolRegistry = await businessNetworkConnection.getAssetRegistry(NS + '.LendingPool');
            await poolRegistry.add(pool);

            let memberRegistry = await businessNetworkConnection.getParticipantRegistry(NS + '.NaturalPerson');
            await memberRegistry.addAll([dan, simon, fritz]);

            await businessNetworkConnection.submitTransaction(accept);

            let newLoanState = await loanRegistry.get(loan.$identifier);
            newLoanState.pool.$identifier.should.equal(pool.$identifier);
        });
    });
});