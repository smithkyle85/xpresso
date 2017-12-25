const express = require('express');
const employeesRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE ||
  './database.sqlite');

const timesheetsRouter = require('./timesheets.js');

employeesRouter.param('employeeId', (req, res, next, employeeId) => {
  const sql = `SELECT * FROM Employee WHERE Employee.id = $employeeId`;
  const values = {$employeeId: employeeId};
  db.get(sql, values, (error, employee) => {
    if (error) {
      next(error);
    } else if (employee) {
      req.employee = employee;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

employeesRouter.use('/:employeeId/timesheets', timesheetsRouter);

employeesRouter.get('/', (req, res, next) => {
  db.all(`SELECT * FROM Employee WHERE is_current_employee = 1`,
    (err, rows) => {
      if (err) {
        next(err);
      } else {
        res.status(200).json({employees: rows});
      }
    });
});

employeesRouter.get('/:employeeId', (req, res, next) => {
  res.status(200).json({employee: req.employee});
});

employeesRouter.post('/', (req, res, next) => {
  const name = req.body.employee.name,
        position = req.body.employee.position,
        wage = req.body.employee.wage,
        cEmp = req.body.employee.isCurrentEmployee === 0 ? 0 : 1;
  if (!name || !position || !wage) {
    return res.sendStatus(400);
  }

  const sql = `
    INSERT INTO Employee (name, position, wage, is_current_employee)
    VALUES ($name, $position, $wage, $cEmp)
    `;
  const values = {
    $name: name,
    $position: position,
    $wage: wage,
    $cEmp: cEmp
  };

  db.run(sql, values, function(error) {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Employee WHERE Employee.id = ${this.lastID}`,
        (error, row) => {
          res.status(201).json({employee: row});
        });
    }
  });
});

employeesRouter.put('/:employeeId', (req, res, next) => {
  const name = req.body.employee.name,
        position = req.body.employee.position,
        wage = req.body.employee.wage,
        cEmp = req.body.employee.isCurrentEmployee === 0 ? 0 : 1;
  if (!name || !position || !wage) {
    return res.sendStatus(400);
  }

  const sql = `
        UPDATE Employee
        SET
          name = $name,
          position = $position,
          wage = $wage,
          is_current_employee = $cEmp
        WHERE Employee.id = $employeeId
        `;
  const values = {
    $name: name,
    $position: position,
    $wage: wage,
    $cEmp: cEmp,
    $employeeId: req.params.employeeId
  };

  db.run(sql, values, (error) => {
    if (error) {
      next(error);
    } else {
      db.get(`
        SELECT *
        FROM Employee WHERE
        Employee.id = ${req.params.employeeId}`,
        (error, row) => {
          res.status(200).json({employee: row});
        });
    }
  });
});

employeesRouter.delete('/:employeeId', (req, res, next) => {
  const sql = `
      UPDATE Employee
      SET
        is_current_employee = 0
      WHERE Employee.id = $employeeId
      `;
  const values = {$employeeId: req.params.employeeId};

  db.run(sql, values, (error) => {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Employee WHERE Employee.id = ${req.params.employeeId}`,
        (error, row) => {
          res.status(200).json({employee: row});
        });
    }
  });
});

module.exports = employeesRouter;
