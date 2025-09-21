# Socket.dev Public Docs MCP Server

A Model Context Protocol (MCP) server that provides access to Socket.dev's public documentation for support purposes.

## Overview

This MCP server acts as a documentation retrieval system for Socket.dev support, using only the public documentation at https://docs.socket.dev as its knowledge source.

## Features

- Search documentation by query
- Retrieve full documentation pages
- Provide citations with canonical URLs
- Structured JSON responses for integration

## Tools

- `search_docs(query)`: Retrieve the top N relevant documentation chunks
- `get_doc(url)`: Fetch the full documentation page

## Response Format

All responses follow this JSON structure:
```json
{
  "answer": "concise technical answer",
  "citations": ["https://docs.socket.dev/..."],
  "metadata": {
    "section_title": "Page Title",
    "last_updated": "YYYY-MM-DD"
  }
}
```