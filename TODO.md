- Write client API
  - `brightsocket` should be exposed globally
  - calling `brightsocket(optional_location)` passes you on to socket.io
  - exposed api should include...
    - `identify(user_type, optional_payload)`
    - `receive` for receiving payloads
    - `send` fro sending payloads
