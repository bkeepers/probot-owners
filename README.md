# GitHub OWNERS

@mention maintainers in Pull Requests based on contents of the [OWNERS](https://github.com/bkeepers/owners) file.

## Usage

1. **[Install the integration](https://github.com/integration/owners)**.
2. Create a [`OWNERS`](https://github.com/bkeepers/OWNERS) file in your repository.
3. Wait for new Pull Requests to be opened

## Deploy your own bot to Heroku

0. [![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy) - Click this button and pick an **App Name** that Heroku is happy with, like `your-name-owners`. Before you can complete this, you'll need config variables from the next step.
0. In another tab, [create an integration](https://developer.github.com/early-access/integrations/creating-an-integration/) on GitHub, using `https://your-app-name.herokuapp.com/` as the **Homepage URL**, **Callback URL**, and **Webhook URL**, and turn on
  - **Pull requests**: **Read & Write**, and check the **Pull request** checkbox
  - **Repository contents**: **Read only**
0. After creating your GitHub integration, go back to the Heroku tab and fill in the configuration variables with the values for the GitHub Integration
0. Create a [`OWNERS`](https://github.com/bkeepers/OWNERS) file in your repository.
