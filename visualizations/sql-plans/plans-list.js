import React from 'react';
import PropTypes from 'prop-types';
import { NrqlQuery, Tooltip } from 'nr1';

export default class PlansList extends React.Component {
  static propTypes = {
    accountId: PropTypes.number,
    selectMessage: PropTypes.func,
  };

  state = {
    data: null,
    messageId: null,
  };

  async componentDidMount() {
    await this.loadData();
  }

  loadData = async () => {
    const { accountId } = this.props;

    const query = `SELECT sql_hostname, database_name, short_text, timestamp, messageId, complete_text FROM Log WHERE query_plan IS NOT NULL`;

    const { data: resp, error } = await NrqlQuery.query({ query, accountId });

    if (resp && resp.length) {
      const { data } = resp[0];
      this.setState({ data });
    }
  };

  dateTimeFormat = (dt) =>
    new Intl.DateTimeFormat('default', {
      year: '2-digit',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    }).format(dt);

  select = (messageId) => {
    const { selectMessage } = this.props;

    if (selectMessage) selectMessage(messageId);
  };

  render() {
    const { accountId } = this.props;
    const { data } = this.state;

    return (
      <>
        {data && (
          <div className="tree-table four-col">
            <div className="cell first-row title">SQL Text</div>
            <div className="cell first-row title">Database</div>
            <div className="cell first-row title">Host</div>
            <div className="cell first-row title">Date/Time</div>
            {data.map((col) => (
              <div className="row" onClick={() => this.select(col.messageId)}>
                <div className="cell reg-fs hdr">
                  <Tooltip text={col.complete_text}>{col.short_text}</Tooltip>
                </div>
                <div className="cell reg-fs">{col.database_name}</div>
                <div className="cell reg-fs">{col.sql_hostname}</div>
                <div className="cell reg-fs">
                  {this.dateTimeFormat(col.timestamp)}
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    );
  }
}
