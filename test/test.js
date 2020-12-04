let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');
let should = chai.should();

let token = "";
chai.use(chaiHttp);

describe('Get the employee info', () => {
    it('it should get employee info', (done) => {
        chai.request('http://localhost:3008/api').get('/employee_info').set("Authorization", "Bearer " + token).end((err, res) => {
            res.should.have.status(200);
           
            done();
        });
    });
});


describe('Get the colleagues info', () => {
    it('it should get employee info', (done) => {
        chai.request('http://localhost:3008/api').get('/colleagues').set("Authorization", "Bearer " + token).end((err, res) => {
            res.should.have.status(200);
            done();
        });
    });
});



describe('Get the direct reportees info', () => {
    it('it should get the direct reportees', (done) => {
        chai.request('http://localhost:3008/api').get('/direct_report').set("Authorization", "Bearer " + token).end((err, res) => {
            res.should.have.status(200);
            done();
        });
    });
});



describe('Update employee details', () => {
    it('it should update employee details', (done) => {

    	 let data = {"emp_id":"andrew.bond@gmail.com","name":"Andrew Bond","dob":"Oct 1, 1975","gender":"Male","mgr_id":null,"dept_name":"CMPE272","position":"Professor","photo_url":"https://d9ejjjzd6egbz.cloudfront.net/7233572017061-bond.jpg","salary":"$355001","location":"F1.007, SJSU Main Campus","contact":"6878564739","skils":"Java,Nodejs","available":"No","available_since":null,"is_mgr":1,"is_admin":null,"skillset":[{"key":"Java,Nodejs","text":"Java,Nodejs"}],"askills":["Java,Nodejs"]}
        chai.request('http://localhost:3008/api').post('/employee_update').set("Authorization", "Bearer " + token).end((err, res) => {
            res.should.have.status(200);
            done();
        });
    });
});


describe('Manager Updates employee details', () => {
    it('Manager updates employee details', (done) => {

    	 let data = {"emp_id":"praveen.nayak86@gmail.com","name":"Praveen Nayak","dob":"Dec 1, 1986","gender":"Male","mgr_id":"andrew.bond@gmail.com","dept_name":"CMPE272","position":"Senior Developer","photo_url":null,"salary":"$155001","location":"F2 114, PAL BLD 5","contact":"45364758696","skils":"Java, SpringBoot","available":"Yes","available_since":"Fri Dec 04 2020","is_mgr":null,"is_admin":null,"skillset":[{"key":"Java","text":"Java"},{"key":"SpringBoot","text":"SpringBoot"}],"askills":["Java","SpringBoot"]}

        chai.request('http://localhost:3008/api').post('/manager_update').set("Authorization", "Bearer " + token).end((err, res) => {
            res.should.have.status(200);
            done();
        });
    });
});

