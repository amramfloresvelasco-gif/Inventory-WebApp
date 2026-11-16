/** Run: node tests/location-comparison.test.js
 * Pure regression suites using the checked-in Apps Script source.
 */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const context=vm.createContext({
  Map,Set,Number,String,Math,JSON,Error,
  INV_RAW_UOMS:['Each','Pounds','Gallons'],
  Logger:{log:message=>console.log(message)}
});
for(const name of ['LocationComparison.gs','LocationComparisonTests.gs','LocationComparisonFixtureTests.gs']){
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',name),'utf8'),context,{filename:name});
}
const rules=vm.runInContext('testInventoryLocationComparisonRules()',context);
const fixtures=vm.runInContext('testInventoryLocationComparisonFixtures()',context);
assert.equal(rules.ok,true);
assert.equal(rules.assertions,26);
assert.equal(fixtures.ok,true);
assert.equal(fixtures.assertions,14);
console.log('PASS 40/40 pure location comparison checks.');
