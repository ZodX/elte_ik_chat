var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
	/**
	 * Responds with a login page.
	 */
	res.render('index', {
		title: 'ELTE-IK - LOGIN'
	});
});

module.exports = router;