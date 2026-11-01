const express = require('express');

const router = express.Router();

/* GET users listing. */
router.get('/', (req, res) => {
  res.send('respond with a resource');
});

/* Your're so cool */
router.get('/cool/', (req, res) => {
  res.send('You\x27re so cool');
});

module.exports = router;
