# aws_logger

aws_logger is a simple utility to capture input to stdin and send it to AWS CloudWatch Logs. The log group must already exist at AWS as a control to prevent log groups being created from typos. The log stream name is generated based on the current UTC date, down to the millisecond, plus a random string.

## Usage

First define the LOG_GROUP environment variable

```bash
# export LOG_GROUP=my_nodejs_logs
```

Then launch the application, piping the output to aws_logger.

```bash
# node app.js | /path/to/aws_logger.js
```

Any text send to stdin will be sent to AWS CloudWatch Logs. The log entries are sent every 5 seconds, when about 25K of data has accumulated, or when stdin is closed (i.e., the source application has exited).
