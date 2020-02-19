const sqlForPartialUpdate = require('../../helpers/partialUpdate');
const request = require('supertest');
const app = require('../../app');


describe("partialUpdate()", () => {
  it("should generate a proper partial update query with just 1 field",
    function () {

      let result = sqlForPartialUpdate("companies", { 'num_employees': 5 }, "handle", "handleID")

      expect(result).toEqual({ query: `UPDATE companies SET num_employees=$1 WHERE handle=$2 RETURNING *`, values: [5, 'handleID'] });

    });
});

