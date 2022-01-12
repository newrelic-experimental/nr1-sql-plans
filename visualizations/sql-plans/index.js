import React from "react";
import PropTypes from "prop-types";
import { Card, CardBody, HeadingText, Spinner, AutoSizer } from "nr1";

import PlansList from "./plans-list";
import PlanTree from "./plan-tree";

export default class SqlPlansVisualization extends React.Component {
  static propTypes = {
    accountId: PropTypes.number,
    compactDetails: PropTypes.bool,
  };

  state = {
    data: null,
    messageId: null,
  };

  selectMessage = (messageId) => this.setState({ messageId: messageId });

  render() {
    const { accountId, compactDetails } = this.props;
    const { messageId } = this.state;

    if (!accountId) return <EmptyState />;

    const display = messageId ? (
      <PlanTree
        accountId={accountId}
        compactDetails={compactDetails}
        messageId={messageId}
        selectMessage={this.selectMessage}
      />
    ) : (
      <PlansList accountId={accountId} selectMessage={this.selectMessage} />
    );

    return <AutoSizer>{({ width, height }) => display}</AutoSizer>;
  }
}

const EmptyState = () => (
  <Card className="EmptyState">
    <CardBody className="EmptyState-cardBody">
      <HeadingText
        spacingType={[HeadingText.SPACING_TYPE.LARGE]}
        type={HeadingText.TYPE.HEADING_3}
      >
        Pick an Account ID to fetch data. <br />
        <br />
        To collect query plan data, use the&nbsp;
        <a href="https://github.com/msummers-nr/nri-mssql/" target="_blank">
          MS SQL integration
        </a>
        .
      </HeadingText>
    </CardBody>
  </Card>
);

const ErrorState = () => (
  <Card className="ErrorState">
    <CardBody className="ErrorState-cardBody">
      <HeadingText
        className="ErrorState-headingText"
        spacingType={[HeadingText.SPACING_TYPE.LARGE]}
        type={HeadingText.TYPE.HEADING_3}
      >
        Oops! Something went wrong.
      </HeadingText>
    </CardBody>
  </Card>
);
