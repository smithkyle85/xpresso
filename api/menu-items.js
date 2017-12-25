const express = require('express');
const menuItemsRouter = express.Router({mergeParams: true});

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE ||
  './database.sqlite');

menuItemsRouter.param('menuItemId', (req, res, next, menuItemId) => {
  const sql = `
      SELECT *
      FROM MenuItem
      WHERE MenuItem.id = $menuItemId`;
  const values = {$menuItemId: menuItemId};
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

menuItemsRouter.get('/', (req, res, next) => {
  const sql = `
    SELECT *
    FROM MenuItem
    WHERE MenuItem.menu_id = $menuId
    `;
  const values = {$menuId: req.params.menuId};
  db.all(sql, values, (error, rows) => {
    if (error) {
      next(error);
    } else {
      res.status(200).json({menuItems: rows});
    }
  });
});

menuItemsRouter.post('/', (req, res, next) => {
  const name = req.body.menuItem.name,
        des = req.body.menuItem.description,
        inv = req.body.menuItem.inventory,
        px = req.body.menuItem.price,
        menuId = req.params.menuId;
  const menuSql = `
      SELECT *
      FROM Menu
      WHERE Menu.id = $menuId
      `;
  const menuValues = {$menuId: menuId};
  db.get(menuSql, menuValues, (error, menu) => {
    if (error) {
      next(error);
    } else {
      if (!name || !des || !inv || !px || !menuId) {
        return res.sendStatus(400);
    }

      const sql = `
          INSERT INTO MenuItem (
            name,
            description,
            inventory,
            price,
            menu_id
            )
          VALUES (
            $name,
            $des,
            $inv,
            $px,
            $menuId
          )`;
      const values = {
        $name: name,
        $des: des,
        $inv: inv,
        $px: px,
        $menuId: menuId
      };

      db.run(sql, values, function(err) {
        if (err) {
          next(err);
        } else {
          db.get(`
            SELECT *
            FROM MenuItem WHERE
            MenuItem.id = ${this.lastID}`,
            (error, row) => {
              res.status(201).json({menuItem: row});
            });
        }
      });
    }
  });
});

menuItemsRouter.put('/:menuItemId', (req, res, next) => {
  const name = req.body.menuItem.name,
        des = req.body.menuItem.description,
        inv = req.body.menuItem.inventory,
        px = req.body.menuItem.price,
        menuId = req.params.menuId;
  const menuSql = `
      SELECT *
      FROM Menu
      WHERE Menu.id = $menuId
      `;
  const menuValues = {$menuId: menuId};
  db.get(menuSql, menuValues, (error, menu) => {
    if (error) {
      next(error);
    } else {
      if (!name || !des || !inv || !px || !menuId) {
        return res.sendStatus(400);
    }

      const sql = `
          UPDATE MenuItem
          SET
            name = $name,
            description = $des,
            inventory = $inv,
            price = $px,
            menu_id = $menuId
          WHERE MenuItem.id = $menuItemId
          `;
      const values = {
        $name: name,
        $des: des,
        $inv: inv,
        $px: px,
        $menuId: menuId,
        $menuItemId: req.params.menuItemId
      };

      db.run(sql, values, function(err) {
        if (err) {
          next(err);
        } else {
          db.get(`
            SELECT *
            FROM MenuItem
            WHERE MenuItem.id = ${req.params.menuItemId}
            `,
            (error, row) => {
              res.status(200).json({menuItem: row});
            });
        }
      });
    }
  });
});

menuItemsRouter.delete('/:menuItemId', (req, res, next) => {
  const menuId = req.params.menuId,
        menuItemId = req.params.menuItemId;
  const menuSql = `
        SELECT *
        FROM Menu
        WHERE Menu.id = $menuId
        `;
  const menuValues = {$menuId: menuId};
  db.get(menuSql, menuValues, (error, menu) => {
      if (error) {
        next(error);
      } else {
    const sql = `
        DELETE
        FROM MenuItem
        WHERE MenuItem.id = $menuItemId
    `;
    const values = {$menuItemId: menuItemId};
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

module.exports = menuItemsRouter;
