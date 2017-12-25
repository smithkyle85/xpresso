const express = require('express');
const menusRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE ||
  './database.sqlite');

const menuItemsRouter = require('./menu-items.js');

menusRouter.param('menuId', (req, res, next, menuId) => {
  const sql = `SELECT * FROM Menu WHERE Menu.id = $menuId`;
  const values = {$menuId: menuId};
  db.get(sql, values, (error, row) => {
    if (error) {
      next(error);
    } else if (row) {
      req.menu = row;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

menusRouter.use('/:menuId/menu-items', menuItemsRouter);

menusRouter.get('/', (req, res, next) => {
  db.all(`SELECT * FROM Menu`,
    (err, rows) => {
      if (err) {
        next(err);
      } else {
        res.status(200).json({menus: rows});
      }
    });
});

menusRouter.get('/:menuId', (req, res, next) => {
  res.status(200).json({menu: req.menu});
});

menusRouter.post('/', (req, res, next) => {
  const title = req.body.menu.title
  if (!title) {
    return res.sendStatus(400);
  }

  const sql = `
    INSERT INTO Menu (title)
    VALUES ($title)
    `;
  const values = {
    $title: title
  };

  db.run(sql, values, function(error) {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Menu WHERE Menu.id = ${this.lastID}`,
        (error, row) => {
          res.status(201).json({menu: row});
        });
    }
  });
});

menusRouter.put('/:menuId', (req, res, next) => {
  const title = req.body.menu.title
  if (!title) {
    return res.sendStatus(400);
  }

  const sql = `
        UPDATE Menu
        SET
          title = $title
        WHERE Menu.id = $menuId
        `;
  const values = {
    $title: title,
    $menuId: req.params.menuId
  };

  db.run(sql, values, (error) => {
    if (error) {
      next(error);
    } else {
      db.get(`
        SELECT *
        FROM Menu WHERE
        Menu.id = ${req.params.menuId}`,
        (error, row) => {
          res.status(200).json({menu: row});
        });
    }
  });
});

menusRouter.delete('/:menuId', (req, res, next) => {
  const itemsSql = `
      SELECT *
      FROM MenuItem
      WHERE MenuItem.menu_id = $menuId
  `;
  const itemsValues = {$menuId: req.params.menuId};
  db.get(itemsSql, itemsValues, (err, items) => {
    if (err) {
      next(err);
    } else if (items) {
      res.sendStatus(400);
    } else {

      const sql = `
          DELETE
          FROM Menu
          WHERE Menu.id = $menuId
      `;
      const values = {$menuId: req.params.menuId};

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

module.exports = menusRouter;
