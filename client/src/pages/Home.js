import React, { Fragment } from "react";
import Gird from "@material-ui/core/Grid";

const Home = () => {
  return (
    <Fragment>
      <Gird container spacing={2}>
        <Gird item sm={8} sx={12}>
          <h1>Hello</h1>
        </Gird>
        <Gird item sm={4} xs={12}>
          <h2>Hello</h2>
        </Gird>
      </Gird>
    </Fragment>
  );
};

export default Home;
