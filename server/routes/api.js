const express = require("express");
const router = express.Router();
const expenseData = require("../expense.json");
const Expense = require("../models/Expense");
const moment = require("moment");

// expenseData.forEach((s) => {
//   let e1 = new Expense({
//     amount: s.amount,
//     group: s.group,
//     item: s.item,
//     date: s.date,
//   });
//   e1.save();
// });

const findTheSmallestDate = function () {
  return Expense.find({}).sort({ date: 1 }).limit(1);
};

const formatDate = function (date) {
  return moment(date).format("YYYY-MM-DD");
};

const getDateFromJson = function (expense) {
  let exp = JSON.stringify(expense);
  d1 = JSON.parse(exp);
  d1 = d1[0].date;
  return formatDate(d1);
};
const filterExpensesByDate = function (d1, d2, res) {
  Expense.find({ $and: [{ date: { $gte: d1 } }, { date: { $lte: d2 } }] })
    .sort({ date: -1 })
    .then(function (expense) {
      res.send(expense);
    })
    .catch((err) => console.log(err));
};
router.get("/expenses", function (req, res) {
  let d2 = req.query.d2 ? formatDate(req.query.d2) : new Date();
  if (req.query.d1 != undefined) {
    let d1 = formatDate(req.query.d1);
    console.log(d1);
    console.log(d2);
    filterExpensesByDate(d1, d2, res);
  } else {
    findTheSmallestDate().then((expense) => {
      filterExpensesByDate(getDateFromJson(expense), d2, res);
    });
  }
});

router.post("/expense", function (req, res) {
  let newExpense = req.body;
  let newDate = newExpense.date
    ? moment(newExpense.date).format("LLLL")
    : moment(new Date()).format("LLLL");
  let e1 = new Expense({
    item: newExpense.item,
    amount: newExpense.amount,
    date: newDate,
    group: newExpense.group,
  });
  e1.save();
  res.send(e1);
});

router.put("/update/:group1/:group2", function (req, res) {
  let group1 = req.params.group1;
  let group2 = req.params.group2;
  Expense.findOneAndUpdate(group1, { group: group2 }, { new: true })
    .then(function (expense) {
      console.log(expense);
    })
    .catch((err) => console.log(err));
});

router.get("/expenses/:group", function (req, res) {
  let group = req.params.group;
  let total = req.query?.total;
  Expense.find({ group: group })
    .then(function (expense) {
      console.log(expense);
    })
    .catch((err) => console.log(err));

  if (total == "true") {
    Expense.aggregate([
      {
        $match: { group: group },
      },
      {
        $group: { _id: "$group", amount: { $sum: "$amount" } },
      },
    ]).then((expenses) => res.send(expenses));
  }
});

module.exports = router;
