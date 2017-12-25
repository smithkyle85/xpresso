const express = require('express');
const timesheetsRouter = express.Router({mergeParams: true});

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE ||
  './database.sqlite');

timesheetsRouter.param('timesheetId', (req, res, next, timesheetId) => {
  const sql = `
      SELECT *
      FROM Timesheet
      WHERE Timesheet.id = $timesheetId`;
  const values = {$timesheetId: timesheetId};
  db.get(sql, values, (error, row) => {
    if (error) {
      next(error);
    } else if (row) {
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

timesheetsRouter.get('/', (req, res, next) => {
  const sql = `
    SELECT *
    FROM Timesheet
    WHERE Timesheet.employee_id = $employeeId
    `;
  const values = {$employeeId: req.params.employeeId};
  db.all(sql, values, (error, rows) => {
    if (error) {
      next(error);
    } else {
      res.status(200).json({timesheets: rows});
    }
  });
});

timesheetsRouter.post('/', (req, res, next) => {
  const hours = req.body.timesheet.hours,
        rate = req.body.timesheet.rate,
        date = req.body.timesheet.date,
        employeeId = req.params.employeeId;
  const employeeSql = `
      SELECT *
      FROM Employee
      WHERE Employee.id = $employeeId
      `;
  const employeeValues = {$employeeId: employeeId};
  db.get(employeeSql, employeeValues, (error, employee) => {
    if (error) {
      next(error);
    } else {
      if (!hours || !rate || !date || !employee) {
        return res.sendStatus(400);
      }

      const sql = `
          INSERT INTO Timesheet (
            hours,
            rate,
            date,
            employee_id
            )
          VALUES (
            $hours,
            $rate,
            $date,
            $empId
          )`;
      const values = {
        $hours: hours,
        $rate: rate,
        $date: date,
        $empId: req.params.employeeId
      };

      db.run(sql, values, function(err) {
        if (err) {
          next(err);
        } else {
          db.get(`
            SELECT *
            FROM Timesheet WHERE
            Timesheet.id = ${this.lastID}`,
            (error, row) => {
              res.status(201).json({timesheet: row});
            });
        }
      });
    }
  });
});

timesheetsRouter.put('/:timesheetId', (req, res, next) => {
  const hours = req.body.timesheet.hours,
        rate = req.body.timesheet.rate,
        date = req.body.timesheet.date,
        employeeId = req.params.employeeId,
        timesheetId = req.params.timesheetId;
  const empSql = `
        SELECT *
        FROM Employee
        WHERE Employee.id = $empId
        `;
  const empValues = {$empId: employeeId};
  db.get(empSql, empValues, (error, emp) => {
    if (error) {
      next(error);
    } else {
      if (!hours || !rate || !date || !emp || !timesheetId) {
        return res.sendStatus(400);
      }

      const sql = `
          UPDATE Timesheet
          SET
            hours = $hours,
            rate = $rate,
            date = $date,
            employee_id = $empId
          WHERE Timesheet.id = $timesheetId
          `;
      const values = {
        $hours: hours,
        $rate: rate,
        $date: date,
        $empId: employeeId,
        $timesheetId: timesheetId
      };

      db.run(sql, values, function(err) {
        if (err) {
          next(err);
        } else {
          db.get(`
            SELECT *
            FROM Timesheet
            WHERE Timesheet.id = ${req.params.timesheetId}
            `,
            (error, row) => {
              res.status(200).json({timesheet: row});
            });
        }
      });
    }
  });
});

timesheetsRouter.delete('/:timesheetId', (req, res, next) => {
  const employeeId = req.params.employeeId,
        timesheetId = req.params.timesheetId;
  const empSql = `
        SELECT *
        FROM Employee
        WHERE Employee.id = $empId
        `;
  const empValues = {$empId: employeeId};
  db.get(empSql, empValues, (error, emp) => {
      if (error) {
        next(error);
      } else {
    const sql = `
        DELETE
        FROM Timesheet
        WHERE Timesheet.id = $timesheetId
    `;
    const values = {$timesheetId: timesheetId};
    db.run(sql, values, (error) => {
      if (error) {
        next(error);
      } else {
        res.sendStatus(204);
      }
    });
  }
  });
});

module.exports = timesheetsRouter;
