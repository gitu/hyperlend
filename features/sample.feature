#
# Licensed under the Apache License, Version 2   (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2  
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
Feature: Happy Path
    Background:
        Given I have deployed the business network definition ..
        And I have added the following participants of type ch.hslu.blc.NaturalPerson
            | email           | firstName | lastName | balance |
            | alice@email.com | Alice     | A        | 0 |
            | bob@email.com   | Bob       | B        | 0 |
            | charlie@email.com   | Charlie   | C        | 0 |
        And I have added the following assets of type ch.hslu.blc.LendingPool
            | poolId  | owner           |
            | 1          | charlie@email.com |
        And I have issued the participant ch.hslu.blc.NaturalPerson#alice@email.com with the identity alice1
        And I have issued the participant ch.hslu.blc.NaturalPerson#bob@email.com with the identity bob1
    Scenario: Alice can add a new loan
        When I use the identity alice1
        When I have added the following assets of type ch.hslu.blc.Loan
            | loanId | owner | state | amount |
            | 1 | alice@email.com | REQUESTED | 1000 |
        Then I should have the following assets of type ch.hslu.blc.LendingPool
            | poolId  | owner           |
            | 1       | charlie@email.com |
        When I submit the following Transaction of type ch.hslu.blc.AcceptToPool
            | loan | pool | specialInterest | fee |
            | 1 | 1 | 0.2 | 0.1 |
        Then I should have the following asset of type ch.hslu.blc.Loan
            | loanId | pool |
            | 1      | 1    |
    