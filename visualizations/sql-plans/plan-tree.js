import React from "react";
import PropTypes from "prop-types";
import { Button, NrqlQuery } from "nr1";

import zlib from "zlib";
import { Buffer } from "buffer";

import TreeNode from "./tree-node";

export default class PlanTree extends React.Component {
  static propTypes = {
    accountId: PropTypes.number,
    compactDetails: PropTypes.bool,
    messageId: PropTypes.string,
    selectMessage: PropTypes.func,
  };

  state = {
    data: null,
  };

  parser = null;

  async componentDidMount() {
    this.parser = new DOMParser();
    await this.loadData();
  }

  parseXML = (xml) => {
    let res;
    try {
      res = this.parser.parseFromString(xml, "text/xml");
    } catch (e) {
      console.error(e);
    }
    if (res) return res;
  };

  jsonFromZip = async (compressedData) => {
    return new Promise((resolve, reject) => {
      zlib.gunzip(compressedData, null, (err, res) => {
        if (err) reject(Error(err));
        if (!err) {
          try {
            const text = new TextDecoder().decode(res);
            const json = JSON.parse(text);
            resolve(json);
          } catch (e) {
            reject(Error(e));
          }
        }
      });
    });
  };

  loadData = async () => {
    const { accountId, messageId } = this.props;

    const query = `SELECT query_plan, blob(\`newrelic.ext.query_plan\`) FROM Log WHERE messageId='${messageId}'`;

    const { data, error } = await NrqlQuery.query({ query, accountId });

    if (data && data.length) {
      const { data: rows } = data[0];
      rows.map((row, r) => {
        const { query_plan: plan, "newrelic.ext.query_plan": blob } = row;
        const planCont = blob ? atob(blob) : "";
        const queryPlan = `${plan || ""}${planCont}`;
        const compressedData = Buffer.from(queryPlan, "base64");
        this.jsonFromZip(compressedData).then((json) => this.buildTree(json));
      });
    }
  };

  buildTree = async (treeData) => {
    let data = {};
    const {
      ShowPlanXML: {
        BatchSequence: {
          Batch: {
            Statements: { StmtSimple: tree },
          },
        },
      } = { ShowPlanXML: { BatchSequence: { Batch: { Statements: {} } } } },
    } = treeData;
    console.log(tree);
    if (tree) {
      const elem = tree.length ? tree.find((el) => "QueryPlan" in el) : tree;
      if (elem) {
        const qpln = elem["QueryPlan"];
        data = {
          type: this.getDataForAttrib(elem, "-StatementType"),
          statement: this.getDataForAttrib(elem, "-StatementText"),
          cachedPlanSize: this.getDataForAttrib(
            qpln || {},
            "-CachedPlanSize",
            true
          ),
          estSubtreeCost: this.getDataForAttrib(
            elem,
            "-StatementSubTreeCost",
            true
          ),
          estNumRowsPerExec: this.getDataForAttrib(
            elem,
            "-StatementEstRows",
            true
          ),
          estOperatorCost: null,
          children: qpln ? [await this.buildBranch(qpln["RelOp"])] : null,
        };
      }
    }

    this.setState({ data });
  };

  buildBranch = async (branchData) => {
    let data = {
      physicalOp: this.getDataForAttrib(branchData, "-PhysicalOp"),
      logicalOp: this.getDataForAttrib(branchData, "-LogicalOp"),
      estExecMode: this.getDataForAttrib(branchData, "-EstimatedExecutionMode"),
      estIOCost: this.getDataForAttrib(branchData, "-EstimateIO", true),
      estCPUCost: this.getDataForAttrib(branchData, "-EstimateCPU", true),
      estSubtreeCost: this.getDataForAttrib(
        branchData,
        "-EstimatedTotalSubtreeCost",
        true
      ),
      estNumRowsPerExec: this.getDataForAttrib(
        branchData,
        "-EstimateRows",
        true
      ),
      estRowSize: this.getDataForAttrib(branchData, "-AvgRowSize", true),
      nodeId: this.getDataForAttrib(branchData, "-NodeId"),
      estRowsRead: this.getDataForAttrib(branchData, "-EstimatedRowsRead"),
    };

    const operationData = this.objectForOperation(branchData, data.physicalOp);

    data.storage = this.getDataForAttrib(operationData, "-Storage");
    data.ordered = Boolean(this.getDataForAttrib(operationData, "-Ordered"));

    if ("Object" in branchData) {
      const { "-Database": db, "-Schema": sch, "-Table": tbl } = branchData[
        "Object"
      ];
      if (db && sch && tbl) data.object = `${db}.${sch}.${tbl}`;
    }

    if ("OutputList" in branchData) {
      const o = branchData["OutputList"]["ColumnReference"];
      if (o && !Array.isArray(o)) {
        const {
          "-Database": db,
          "-Schema": sch,
          "-Table": tbl,
          "-Column": col,
        } = o;
        if (db && sch && tbl && col)
          data.outputList = `${db}.${sch}.${tbl}.${col}`;
      }
    }

    const nextData = operationData.RelOp;
    if (nextData) {
      if (Array.isArray(nextData)) {
        const promises = nextData.map((data) => this.buildBranch(data));
        data.children = await Promise.all(promises);
      } else {
        data.children = [await this.buildBranch(nextData)];
      }
    }

    return data;
  };

  getDataForAttrib = (obj, attrib, isNumeric) => {
    const ret = obj && attrib in obj ? obj[attrib] : null;
    return isNumeric ? Number(ret) : ret;
  };

  objectForOperation = (data, operation) => {
    const ignoreKeys = ["OutputList", "MemoryFractions"];
    const key = Object.keys(data).find(
      (k) => !ignoreKeys.includes(k) && typeof data[k] === "object"
    );
    return key ? data[key] : null;
  };

  back = () => {
    const { selectMessage } = this.props;

    if (selectMessage) selectMessage(null);
  };

  render() {
    const { accountId, compactDetails } = this.props;
    const { data } = this.state;

    return (
      <>
        {data && (
          <>
            <div className="tree-table">
              <div className="cell first-row" />
              <div className="cell first-row title">Estimated Subtree Cost</div>
              <div className="cell first-row title">Estimated CPU Cost</div>
              <TreeNode
                data={data}
                isParent={true}
                level={0}
                compactDetails={compactDetails}
              />
            </div>
            <div className="back-btn">
              <Button
                type={Button.TYPE.PLAIN_NEUTRAL}
                sizeType={Button.SIZE_TYPE.SMALL}
                iconType={Button.ICON_TYPE.INTERFACE__ARROW__ARROW_LEFT}
                onClick={this.back}
              />
            </div>
          </>
        )}
      </>
    );
  }
}
