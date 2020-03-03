var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
	/**
	 * Responds with a jail page.
	 */
	res.render('jail', {
		title: 'ELTE-IK - JAIL'
	});
});

module.exports = router;