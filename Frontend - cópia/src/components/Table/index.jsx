import { Table as TableReact } from "reactstrap";
import _ from "lodash";
import styles from "./styles.module.scss";

const Table = ({ columns = [], rows = { data: [], pagination: {} } }) => {
  // normalize rows to always be an array of records
  const dataRows = Array.isArray(rows) ? rows : (rows && rows.data) || [];
  return (
    <TableReact hover>
      <thead>
        <tr>
          {columns.map((colum, index) => (
            <th key={index}>{colum}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {dataRows.map((row, index) => {
          return (
            <tr key={index}>
            {
                columns.map((column) => {
                    return <td key={column}>{_.get(row, column)}</td>;
                })
            }
            </tr>
          );
        })}
      </tbody>
    </TableReact>
  );
};

export default Table;
