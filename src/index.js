#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { DocumentationService } from "./documentation-service.js";

class SocketDocsServer {
  constructor() {
    this.server = new Server(
      {
        name: "socket-docs-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.docService = new DocumentationService();
    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "search_docs",
            description: "Search Socket.dev documentation for relevant content",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "Search query for documentation",
                },
                limit: {
                  type: "number",
                  description: "Maximum number of results to return (default: 5)",
                  default: 5,
                },
              },
              required: ["query"],
            },
          },
          {
            name: "get_doc",
            description: "Retrieve a specific documentation page by URL",
            inputSchema: {
              type: "object",
              properties: {
                url: {
                  type: "string",
                  description: "Canonical URL of the documentation page",
                },
              },
              required: ["url"],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        switch (name) {
          case "search_docs":
            return await this.handleSearchDocs(args);
          case "get_doc":
            return await this.handleGetDoc(args);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error.message}`
        );
      }
    });
  }

  async handleSearchDocs(args) {
    const { query, limit = 5 } = args;

    if (!query || typeof query !== "string") {
      throw new McpError(
        ErrorCode.InvalidParams,
        "Query parameter is required and must be a string"
      );
    }

    const results = await this.docService.searchDocs(query, limit);

    if (!results || results.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              answer: "No relevant documentation found. Escalate or log feedback.",
              citations: [],
              metadata: { section_title: "No Results", last_updated: null }
            }, null, 2)
          }
        ]
      };
    }

    const response = this.formatSearchResponse(results, query);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(response, null, 2)
        }
      ]
    };
  }

  async handleGetDoc(args) {
    const { url } = args;

    if (!url || typeof url !== "string") {
      throw new McpError(
        ErrorCode.InvalidParams,
        "URL parameter is required and must be a string"
      );
    }

    if (!url.startsWith("https://docs.socket.dev") && !url.startsWith("https://github.com")) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "URL must be from docs.socket.dev or github.com domain"
      );
    }

    const doc = await this.docService.getDoc(url);

    if (!doc) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              answer: "No relevant documentation found. Escalate or log feedback.",
              citations: [],
              metadata: { section_title: "Document Not Found", last_updated: null }
            }, null, 2)
          }
        ]
      };
    }

    const response = {
      answer: doc.content,
      citations: [doc.url],
      metadata: {
        section_title: doc.title,
        last_updated: doc.lastUpdated
      }
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(response, null, 2)
        }
      ]
    };
  }

  formatSearchResponse(results, query) {
    const topResult = results[0];
    const citations = [...new Set(results.map(r => r.url))];

    return {
      answer: topResult.content,
      citations: citations,
      metadata: {
        section_title: topResult.title,
        last_updated: topResult.lastUpdated
      }
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Socket.dev Documentation MCP server running on stdio");
  }
}

const server = new SocketDocsServer();
server.run().catch(console.error);