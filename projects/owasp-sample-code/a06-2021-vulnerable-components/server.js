/**
 * A06:2021 – Vulnerable and Outdated Components
 * This example demonstrates using libraries with known vulnerabilities
 * and showcases the impact of not updating dependencies
 */

const express = require('express');
const bodyParser = require('body-parser');
const serialize = require('node-serialize');
const _ = require('lodash');
const ejs = require('ejs');
const app = express();

// Setup middleware
app.use(bodyParser.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');

/**
 * VULNERABILITY: Using node-serialize package with RCE vulnerability
 * The 'node-serialize' package has a known vulnerability that allows
 * Remote Code Execution when unserializing user input
 */
app.post('/api/store-data', (req, res) => {
    const userData = req.body.data;
    
    // VULNERABILITY: Deserializing user-provided data with vulnerable package
    try {
        // This is vulnerable to remote code execution
        const deserializedData = serialize.unserialize(userData);
        
        res.json({
            status: 'success',
            data: deserializedData
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});

/**
 * VULNERABILITY: Using vulnerable Lodash version (4.17.15)
 * Prototype pollution vulnerability (CVE-2019-10744)
 */
app.post('/api/merge-objects', (req, res) => {
    const object1 = req.body.object1 || {};
    const object2 = req.body.object2 || {};
    
    // VULNERABILITY: Using vulnerable merge function
    // This version of lodash is vulnerable to prototype pollution
    const mergedObject = _.merge({}, object1, object2);
    
    res.json({
        status: 'success',
        result: mergedObject
    });
});

/**
 * VULNERABILITY: Using vulnerable EJS version with RCE potential
 */
app.get('/page-template', (req, res) => {
    const userTemplate = req.query.template || '';
    
    // VULNERABILITY: Directly using user input in template rendering
    // Older EJS versions have security issues that might allow code execution
    const html = ejs.render(userTemplate, {
        user: {
            name: 'User',
            isAdmin: false
        }
    });
    
    res.send(html);
});

/**
 * Endpoint to demonstrate impact of outdated dependencies
 */
app.get('/system-info', (req, res) => {
    // VULNERABILITY: Exposing dependency versions to users
    const dependencies = {
        'express': '3.4.7',        // Multiple vulnerabilities including DoS
        'lodash': '4.17.15',       // Prototype pollution vulnerability
        'node-serialize': '0.0.4', // Remote code execution
        'ejs': '2.5.5',            // Potential for remote code execution
    };
    
    res.json({
        status: 'success',
        server: {
            frameworkVersion: dependencies.express,
            nodeVersion: process.version,
            dependencies: dependencies
        }
    });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

/**
 * Example of exploiting the node-serialize vulnerability:
 * 
 * Send a POST request to /api/store-data with this payload:
 * {"data":"_$$ND_FUNC$$_function(){require('child_process').exec('ls -la', function(error, stdout, stderr) { console.log(stdout) });}()"}
 * 
 * Example of exploiting lodash prototype pollution:
 * Send a POST request to /api/merge-objects with this payload:
 * {"object1":{"__proto__":{"polluted":"Yes!"}},"object2":{}}
 * 
 * After this, every object will have a 'polluted' property
 */
