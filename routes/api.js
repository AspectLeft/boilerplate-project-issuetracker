/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";

var expect = require("chai").expect;
var MongoClient = require("mongodb");
var ObjectId = require("mongodb").ObjectID;

const { body, validationResult } = require("express-validator");

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

module.exports = function(app, db) {
  app
    .route("/api/issues/:project")

    .get(function(req, res) {
      var project = req.params.project;

      const filters = Object.assign({}, req.query);

      if (filters["open"]) {
        filters["open"] = filters["open"] === "true";
      }

      db.collection("issues_" + project)
        .find(filters, {
          limit: 1000
        })
        .toArray((err, issueArray) => {
          if (err) throw err;
          res.status(200).json(issueArray);
        });
    })

    .post(
      [
        body("issue_title").notEmpty(),
        body("issue_text").notEmpty(),
        body("created_by").notEmpty()
      ],
      function(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        var project = req.params.project;

        db.collection("issues_" + project).insertOne(
          {
            issue_title: req.body.issue_title,
            issue_text: req.body.issue_text,
            created_by: req.body.created_by,
            assigned_to: req.body.assigned_to || "",
            status_text: req.body.status_text || "",
            created_on: new Date(),
            updated_on: new Date(),
            open: true
          },
          (err, result) => {
            if (err) throw err;
            //console.log("created 1 issue");
            //console.log(result.ops[0]);
            res.json(result.ops[0]);
          }
        );
      }
    )

    .put(function(req, res) {
      if (!req.body._id) {
        return res.status(400).json("_id error");
      }

      const _id = req.body._id;
      const issue_title = req.body.issue_title;
      const issue_text = req.body.issue_text;
      const created_by = req.body.created_by;
      const assigned_to = req.body.assigned_to;
      const status_text = req.body.status_text;
      const open = req.body.open;
    
      const update = {
        issue_title: issue_title || undefined,
        issue_text: issue_text || undefined,
        created_by: created_by || undefined,
        assigned_to: assigned_to || undefined,
        status_text: status_text || undefined,
        open: open ? (open === 'true') : undefined
      };

      if (
        !Object.keys(update).reduce(
          (count, key) => count + (update[key] ? 1 : 0),
          0
        )
      ) {
        return res.status(200).json("no updated field sent");
      }

      update["updated_on"] = new Date();

      var project = req.params.project;
      db.collection("issues_" + project).findOneAndUpdate(
        {
          _id: ObjectId(_id)
        },
        { $set: update },
        {
          returnOriginal: false,
          ignoreUndefined: true
        },
        (err, result) => {
          if (err) throw err;

          if (result.value) {
            res.status(200).json("successfully updated " + _id);
          } else {
            res.status(200).json("could not update " + _id);
          }
        }
      );
      console.log(req.body);
    })

    .delete(function(req, res) {
      if (!req.body._id) {
        return res.status(400).json("_id error");
      }

      const _id = req.body._id;
    
      var project = req.params.project;
      db.collection("issues_" + project).deleteOne({
        _id: ObjectId(_id)
      }, (err, result) => {
        if (err) throw err;
        
        if (result.result.n) {
          return res.status(200).json("deleted " + _id);
        }
        else {
          return res.status(200).json("could not delete " + _id);
        }
      })
    });
};
