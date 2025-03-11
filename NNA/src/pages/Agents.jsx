import { useState, useEffect, useCallback, useRef } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Carousel from "react-bootstrap/Carousel";
import PerformanceChart from "../components/PerformanceChart";
import DAGSugi from "../components/DAGSugi";
import DAGSugiDev from "../components/DAGSugiDev";
import AgentsTab from "../components/dagComps/AgentSelect";
import EpisodeList from "../components/dagComps/EpisodeSelect";
import "../styles/Agents.css";
import Properties from "../components/Properties";
import TablesList from "../BackendTest/TablesList";
import DAGTest from "../components/DAGTest";

function Agents() {
  const [agents, setAgents] = useState([]);
  const [activeAgent, setActiveAgent] = useState(null);
  const [index, setIndex] = useState(0);
  const [episodes, setEpisodes] = useState([]);
  const [activeEpisode, setActiveEpisode] = useState(null);
  const [iterationCount, setIterationCount] = useState(0);
  const [selectedNode, setSelectedNode] = useState(null);
  const selectedNodeRef = useRef(null);
  const timestamp = "2025-01-02 10:10:10";
  const ws = useRef(null); // WebSocket reference

  const fetchAgentCount = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/AgentCount/${encodeURIComponent(timestamp)}`
      );
      const data = await response.json();

      if (data.totalagents) {
        const totalagents = parseInt(data.totalagents, 10);
        const generatedAgents = Array.from({ length: totalagents }, (_, i) => ({
          id: `Agent ${i + 1}`,
          name: `Agent ${i + 1}`,
        }));

        setAgents(generatedAgents);
        setActiveAgent((prev) =>
          generatedAgents.some((agent) => agent.id === prev)
            ? prev
            : generatedAgents[0]?.id || null
        );
      } else {
        setAgents([]);
        setActiveAgent(null);
      }
    } catch (error) {
      console.error("Error fetching agent count:", error);
    }
  };

  const fetchEpisodeCount = async (agentNum) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/EpisodeCount/${encodeURIComponent(agentNum)}`
      );
      const data = await response.json();

      if (data.totalepisodes) {
        const totalepisodes = parseInt(data.totalepisodes, 10);
        const generatedEpisodes = Array.from(
          { length: totalepisodes },
          (_, i) => ({
            name: `Episode ${i + 1}`,
          })
        );
        setEpisodes(generatedEpisodes);
        setActiveEpisode((prev) =>
          generatedEpisodes.some((ep) => ep.name === prev?.name)
            ? prev
            : generatedEpisodes[0] || null
        );
      } else {
        setEpisodes([]);
        setActiveEpisode(null);
      }
    } catch (error) {
      console.error("Error fetching episode count:", error);
    }
  };

  const fetchIterationCount = async (agentNum, episodeNum) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/IterationCount/${encodeURIComponent(
          agentNum
        )}/${encodeURIComponent(episodeNum)}`
      );
      const data = await response.json();

      if (data.totaliterations) {
        setIterationCount(parseInt(data.totaliterations, 10));
      } else {
        setIterationCount(0);
      }
    } catch (error) {
      console.error("Error fetching iteration count:", error);
    }
  };

  useEffect(() => {
    fetchAgentCount();
  }, [timestamp]);

  useEffect(() => {
    if (activeAgent) {
      setIndex(0);
      const agentNum = activeAgent.split(" ")[1];
      fetchEpisodeCount(agentNum);
    }
  }, [activeAgent]);

  useEffect(() => {
    if (activeAgent && activeEpisode) {
      setIndex(0);
      const agentNum = activeAgent.split(" ")[1];
      const episodeNum = activeEpisode.name.split(" ")[1];
      fetchIterationCount(agentNum, episodeNum);
    }
  }, [activeAgent, activeEpisode]);

  const handleAgentChange = (agentId) => setActiveAgent(agentId);
  const handleEpisodeClick = (episode) => setActiveEpisode(episode);
  const handleNextIteration = (selectedIndex) => setIndex(selectedIndex);
  const handleNodeClick = useCallback((nodeData) => {
    selectedNodeRef.current = nodeData;
    setSelectedNode(nodeData);
  }, []);

  useEffect(() => {
    ws.current = new WebSocket("ws://localhost:3000");

    ws.current.onopen = () => console.log("WebSocket connected!");
    ws.current.onmessage = (event) => {
      try {
        const realTimeData = JSON.parse(event.data);
        console.log("Received WebSocket update:", realTimeData);

        if (realTimeData.graphid) {
          fetchAgentCount();
          if (activeAgent) {
            const agentNum = activeAgent.split(" ")[1];
            fetchEpisodeCount(agentNum);

            if (activeEpisode) {
              const episodeNum = activeEpisode.name.split(" ")[1];
              fetchIterationCount(agentNum, episodeNum);
            }
          }
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.current.onclose = () => {
      console.log("WebSocket disconnected. Attempting to reconnect...");
      setTimeout(() => {
        ws.current = new WebSocket("ws://localhost:3000");
      }, 3000);
    };

    ws.current.onerror = (error) => console.error("WebSocket error:", error);

    return () => {
      if (ws.current) ws.current.close();
    };
  }, [activeAgent, activeEpisode]);

  return (
    <div>
      <Container>
        <div className="elements-container">
          <Row>
            <h3 className="topic-name">
              Network Architecture - Direct Acyclic Graph
            </h3>
            <Col>
              <EpisodeList
                episode={episodes}
                activeEpisode={activeEpisode}
                onEpisodeClick={handleEpisodeClick}
              />
            </Col>
            <Col>
              <div className="centered-container">
                <div className="shadow-lg rounded">
                  {agents.length > 0 && iterationCount > 0 ? (
                    <Carousel
                      fade
                      interval={null}
                      activeIndex={index}
                      onSelect={(selectedIndex) => setIndex(selectedIndex)}
                      data-bs-theme="dark"
                    >
                      {Array.from({ length: iterationCount }, (_, i) => (
                        <Carousel.Item key={i}>
                          <AgentsTab
                            agents={agents}
                            activeAgent={activeAgent}
                            onAgentChange={handleAgentChange}
                          />
                          <DAGTest
                            iteration={i + 1}
                            agent={activeAgent}
                            episode={activeEpisode?.name}
                          />
                          {/* <DAGSugiDev
                            agentNum={activeAgent.split(" ")[1]}
                            episodeNum={activeEpisode.name.split(" ")[1]}
                            iterationNum={index + 1}
                            onNodeClick={handleNodeClick}
                          /> */}
                          <Carousel.Caption>
                            <h5>{activeAgent}</h5>
                            <p>
                              {activeEpisode?.name} - Iteration {i + 1}
                            </p>
                          </Carousel.Caption>
                        </Carousel.Item>
                      ))}
                    </Carousel>
                  ) : (
                    <p>
                      The reinforcement learning running session selected does
                      not exist
                    </p>
                  )}
                </div>
              </div>
            </Col>
          </Row>
        </div>
        <div className="elements-container">
          <Row>
            <Col>
              <h3>{activeAgent}'s Training Time and Accuracy</h3>
              <div className="shadow-lg rounded">
                <div className="centered-container">
                  {activeAgent && activeEpisode ? (
                    <PerformanceChart
                      agentNum={activeAgent.split(" ")[1]}
                      episodeNum={activeEpisode.name.split(" ")[1]}
                    />
                  ) : (
                    <p>Loading Performance Chart...</p>
                  )}
                </div>
              </div>
            </Col>
            <Col>
              <h3>Node Properties</h3>
              <div className="shadow-lg rounded">
                <Properties node={selectedNode} />
              </div>
            </Col>
          </Row>
        </div>
        <div className="elements-container">
          <Row>
            <Col>
              <h3>BackEnd Test</h3>
              <TablesList />
            </Col>
          </Row>
        </div>
      </Container>
    </div>
  );
}

export default Agents;
