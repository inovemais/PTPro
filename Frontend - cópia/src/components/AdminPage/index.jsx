import React, { useState } from "react";
import styles from "./styles.module.scss";
import {
  Row,
  Container,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
} from "reactstrap";
import Games from "./components/Games/index.jsx";
import Stadium from "./components/Stadium/index.jsx";
import Users from "./components/Users/index.jsx";
import Tickets from "./components/Tickets/index.jsx";
import MemberRequests from "./components/MemberRequests/index.jsx";

const navItems = [
  {
    id: "1",
    title: "Users",
  },
  {
    id: "2",
    title: "Stadium",
  },
  {
    id: "3",
    title: "Games",
  },
  {
    id: "4",
    title: "Tickets",
  },
  {
    id: "5",
    title: "Member Requests",
  },
];

const items = [
  {
    id: "1",
    children: <Users />,
  },
  {
    id: "2",
    children: <Stadium/>,
  },
  {
    id: "3",
    children: <Games/>,
  },
  {
    id: "4",
    children: <Tickets/>,
  },
  {
    id: "5",
    children: <MemberRequests/>,
  },
];

const AdminPage = () => {
  const [activePage, setActivePage] = useState("1");

  return (
    <Container className={styles.container}>
      <h1>Admin</h1>
      <Row className={styles.row}>
        <Nav tabs>
            {navItems.map((item) => {
              return (
                <NavItem key={item.id}>
                  <NavLink
                    active={item.id === activePage}
                    onClick={() => setActivePage(item.id)}
                  >
                    {item.title}
                  </NavLink>
                </NavItem>
              );
            })}
        </Nav>
        <TabContent activeTab={activePage}>
          {items.map((item) => {
            return (
              <TabPane key={item.id} tabId={item.id}>
                { item.children }
              </TabPane>
            );
          })}
        </TabContent>
      </Row>
    </Container>
  );
};

export default AdminPage;
