var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
    /**
     * Checks if the nickname is in the query.
     * If it's not, then the router sends back
     * the index page, with an error.
     */
    let nickname = req.query.nickname;
    if (nickname != null && nickname != undefined && nickname != '') {
        res.render('chat', {
            title: 'ELTE-IK - CHAT'
        });
    } else {
        res.render('index', {
            title: 'ELTE-IK - LOGIN',
            error: 'The nickname must be at least 1 character long.'
        });
    }
});

module.exports = router;