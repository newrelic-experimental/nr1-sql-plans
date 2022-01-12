import React from "react";
import PropTypes from "prop-types";

import id from "./id";

export default class TreeNode extends React.Component {
  static propTypes = {
    data: PropTypes.object,
    isParent: PropTypes.bool,
    level: PropTypes.number,
    compactDetails: PropTypes.bool,
  };

  state = {
    showDetail: false,
  };

  async componentDidMount() {
    this.uid = id();
  }

  renderItem = (item, value) => (
    <div className="item">
      <div className="title">{item}</div>
      <div className="value">{value}</div>
    </div>
  );

  renderParent = () => {
    const { data, level, compactDetails } = this.props;
    const { showDetail } = this.state;

    return (
      <>
        <div
          className="cell hdr"
          style={{ paddingLeft: `${level * 8}px` }}
          onClick={this.toggleDetail}
        >
          {data.type}
        </div>
        <div className="cell num">{this.displayNum(data.estSubtreeCost)}</div>
        <div className="cell num">&nbsp;</div>
        <div
          className={`cell detail ${showDetail ? "show" : ""} ${
            compactDetails ? "compact" : ""
          }`}
          style={{ marginLeft: `${level * 8}px` }}
        >
          {this.renderItem("Cached Plan Size", data.cachedPlanSize)}
          {this.renderItem("Estimated Operator Cost", "???")}
          {this.renderItem("Estimated Subtree Cost", data.estSubtreeCost)}
          {this.renderItem(
            "Estimated Number of Rows Per Execution",
            data.estNumRowsPerExec
          )}
          <div className="break" />
          {this.renderItem("Statement", data.statement)}
        </div>
      </>
    );
  };

  renderNode = () => {
    const { data, level, compactDetails } = this.props;
    const { showDetail } = this.state;

    return (
      <>
        <div
          className="cell hdr"
          style={{ paddingLeft: `${level * 8}px` }}
          onClick={this.toggleDetail}
        >
          {data.physicalOp}
        </div>
        <div className="cell num">{this.displayNum(data.estSubtreeCost)}</div>
        <div className="cell num">{this.displayNum(data.estCPUCost)}</div>
        <div
          className={`cell detail ${showDetail ? "show" : ""} ${
            compactDetails ? "compact" : ""
          }`}
          style={{ marginLeft: `${level * 8}px` }}
        >
          {this.renderItem("Physical Operation", data.physicalOp)}
          {this.renderItem("Logical Operation", data.logicalOp)}
          {this.renderItem("Estimated Execution Mode", data.estExecMode)}
          {"storage" in data ? this.renderItem("Storage", data.storage) : null}
          {this.renderItem(
            "Estimated I/O Cost",
            this.displayNum(data.estIOCost)
          )}
          {this.renderItem("Estimated CPU Cost", data.estCPUCost)}
          {this.renderItem("Estimated Subtree Cost", data.estSubtreeCost)}
          {"estRowsRead" in data
            ? this.renderItem(
                "Estimated Number of Rows to be Read",
                data.estRowsRead
              )
            : null}
          {this.renderItem(
            "Estimated Number of Rows Per Execution",
            data.estNumRowsPerExec
          )}
          {this.renderItem("Estimated Row Size (B)", data.estRowSize)}
          {"ordered" in data
            ? this.renderItem("Ordered", data.ordered.toString())
            : null}
          {this.renderItem("Node ID", data.nodeId)}
          {"object" in data && (
            <>
              <div className="break" />
              {this.renderItem("Object", data.object)}
            </>
          )}
          {"outputList" in data && (
            <>
              <div className="break" />
              {this.renderItem("Object", data.outputList)}
            </>
          )}
        </div>
      </>
    );
  };

  toggleDetail = () =>
    this.setState((state) => ({ showDetail: !state.showDetail }));

  displayNum = (num) => {
    const parts = String(num).split(/[eE]/);
    if (!parts || !parts.length) return "";
    if (parts.length === 1) return parts[0];
    return num.toFixed(Math.abs(parts.pop()));
  };

  render() {
    const { data, isParent, level, compactDetails } = this.props;

    let nodes = null;

    if (data.children)
      nodes = data.children.map((child) => (
        <TreeNode
          data={child}
          level={level + 1}
          compactDetails={compactDetails}
        />
      ));

    return (
      <>
        <>{isParent ? this.renderParent() : this.renderNode()}</>
        {nodes}
      </>
    );

    return (
      <li>
        <input type="checkbox" id={`tree-node-${this.uid}`} />
        <label htmlFor={`tree-node-${this.uid}`}>
          <div className="branch">
            {isParent ? this.renderParent() : this.renderNode()}
          </div>
        </label>
        {nodes ? <ul className="tree-view">{nodes}</ul> : null}
      </li>
    );
  }
}
