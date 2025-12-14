// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IInputVerifier {
    function verify(address user, bytes calldata inputProof) external returns (uint256[] memory handles);
}

contract PrisonersDilemma {
    enum Choice {
        Cooperate,
        Defect
    }

    enum ConditionSubject {
        RoundNumber,
        MyLastMove,
        OpponentLastMove,
        MyTotalDefects,
        OpponentTotalDefects,
        OpponentTotalCooperates
    }

    enum ConditionOperator {
        Is,
        IsNot,
        GreaterThan,
        LessThan,
        Equals
    }

    enum TournamentStatus {
        Registration,
        PendingComputation,
        ResultsPublished,
        Finished
    }

    struct Rule {
        ConditionSubject subject;
        ConditionOperator operator;
        uint256 value;
    }

    struct EncryptedStrategy {
        Rule[] rules;
        uint256 encryptedActions; // Packed Handle: [Default(8)][Rule0(8)][Rule1(8)]...
        bool isSubmitted;
    }

    struct TournamentInfo {
        uint256 tournamentId;
        TournamentStatus status;
        uint256 startTime;
        uint256 playerCount;
        uint256 totalGames;
        uint256 rounds;
        uint256 prizePool;
    }

    struct VoteInfo {
        uint256 voteCount;
        mapping(address => bool) hasVoted;
        uint256 requiredVotes;
    }

    struct PublishedResults {
        mapping(address => uint256) scores;
        address[] winners;
        uint256[] prizes;
        bool isPublished;
    }

    uint256 public constant DEFAULT_ROUNDS = 50;
    uint256 public constant MIN_ROUNDS = 10;
    uint256 public constant MAX_ROUNDS = 200;
    uint256 public constant ENTRY_FEE = 0.01 ether;
    uint256 public constant WINNER_PERCENTAGE = 30;
    uint256 public constant VOTE_QUORUM = 50;
    uint256 public constant MAX_RULES = 10;

    address public owner;
    address public computationOracle;
    address public inputVerifier;
    
    mapping(uint256 => mapping(address => EncryptedStrategy)) private encryptedStrategies;
    mapping(uint256 => TournamentInfo) public tournaments;
    mapping(uint256 => address[]) public tournamentPlayers;
    mapping(uint256 => VoteInfo) private tournamentVotes;
    mapping(uint256 => PublishedResults) private tournamentResults;
    
    uint256 public currentTournamentId;
    TournamentInfo public currentTournament;

    event StrategySubmitted(address indexed player, uint256 tournamentId);
    event TournamentCreated(uint256 indexed tournamentId);
    event VoteCast(uint256 indexed tournamentId, address indexed voter, uint256 currentVotes, uint256 requiredVotes);
    event TournamentStarted(uint256 indexed tournamentId, uint256 playerCount);
    event ResultsPublished(uint256 indexed tournamentId, address[] winners, uint256[] prizes);
    event TournamentFinished(uint256 indexed tournamentId);
    event ComputationOracleSet(address indexed oracle);
    event InputVerifierSet(address indexed verifier);
    event TournamentRoundsSet(uint256 indexed tournamentId, uint256 rounds);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyOracle() {
        require(msg.sender == computationOracle || msg.sender == owner, "Only oracle");
        _;
    }

    modifier onlyRegistration() {
        require(currentTournament.status == TournamentStatus.Registration, "Not in registration");
        _;
    }

    constructor(address _inputVerifier) {
        owner = msg.sender;
        computationOracle = msg.sender;
        inputVerifier = _inputVerifier;
        currentTournamentId = 0;
        currentTournament = TournamentInfo({
            tournamentId: 0,
            status: TournamentStatus.Registration,
            startTime: 0,
            playerCount: 0,
            totalGames: 0,
            rounds: DEFAULT_ROUNDS,
            prizePool: 0
        });
    }

    function setComputationOracle(address oracle) external onlyOwner {
        require(oracle != address(0), "Invalid oracle");
        computationOracle = oracle;
        emit ComputationOracleSet(oracle);
    }

    function setInputVerifier(address verifier) external onlyOwner {
        require(verifier != address(0), "Invalid verifier");
        inputVerifier = verifier;
        emit InputVerifierSet(verifier);
    }

    function submitStrategy(
        bytes calldata inputProof,
        ConditionSubject[] calldata subjects,
        ConditionOperator[] calldata operators,
        uint256[] calldata values
    ) external payable onlyRegistration {
        require(msg.value >= ENTRY_FEE, "Insufficient entry fee");
        require(subjects.length == operators.length && operators.length == values.length, "Mismatched arrays");
        require(subjects.length <= MAX_RULES, "Too many rules");
        require(!encryptedStrategies[currentTournamentId][msg.sender].isSubmitted, "Strategy already submitted");

        // Verify input proof and get handles
        // Expected order: [packedActions]
        uint256[] memory handles = IInputVerifier(inputVerifier).verify(msg.sender, inputProof);
        require(handles.length == 1, "Invalid input proof length");

        delete encryptedStrategies[currentTournamentId][msg.sender].rules;

        EncryptedStrategy storage strategy = encryptedStrategies[currentTournamentId][msg.sender];
        strategy.isSubmitted = true;

        strategy.encryptedActions = handles[0];
        
        for (uint256 i = 0; i < subjects.length; i++) {
            _validateRuleStructure(subjects[i], operators[i]);
            
            strategy.rules.push(Rule({
                subject: subjects[i],
                operator: operators[i],
                value: values[i]
            }));
        }

        tournamentPlayers[currentTournamentId].push(msg.sender);
        currentTournament.playerCount++;
        currentTournament.prizePool += msg.value;

        VoteInfo storage votes = tournamentVotes[currentTournamentId];
        votes.requiredVotes = (currentTournament.playerCount * VOTE_QUORUM) / 100;
        if (votes.requiredVotes < 2) votes.requiredVotes = 2;

        emit StrategySubmitted(msg.sender, currentTournamentId);
    }

    function setTournamentRounds(uint256 rounds) external onlyOwner onlyRegistration {
        require(rounds >= MIN_ROUNDS && rounds <= MAX_ROUNDS, "Invalid rounds");
        currentTournament.rounds = rounds;
        emit TournamentRoundsSet(currentTournamentId, rounds);
    }

    function voteStartTournament() external {
        require(currentTournament.status == TournamentStatus.Registration, "Not in registration");
        require(encryptedStrategies[currentTournamentId][msg.sender].isSubmitted, "Must submit strategy to vote");
        
        VoteInfo storage votes = tournamentVotes[currentTournamentId];
        require(!votes.hasVoted[msg.sender], "Already voted");
        
        votes.hasVoted[msg.sender] = true;
        votes.voteCount++;

        emit VoteCast(currentTournamentId, msg.sender, votes.voteCount, votes.requiredVotes);

        if (votes.voteCount >= votes.requiredVotes) {
            _startTournament();
        }
    }

    function forceStartTournament() external onlyOwner {
        _startTournament();
    }

    function _startTournament() private {
        require(currentTournament.status == TournamentStatus.Registration, "Invalid status");
        require(currentTournament.playerCount >= 2, "Need at least 2 players");

        currentTournament.status = TournamentStatus.PendingComputation;
        currentTournament.startTime = block.timestamp;
        
        uint256 n = currentTournament.playerCount;
        currentTournament.totalGames = (n * (n - 1)) / 2;

        emit TournamentStarted(currentTournamentId, currentTournament.playerCount);
    }

    function publishResults(
        uint256 tournamentId,
        address[] calldata players,
        uint256[] calldata scores,
        address[] calldata winners,
        uint256[] calldata prizes
    ) external onlyOracle {
        require(tournamentId == currentTournamentId, "Invalid tournament");
        require(currentTournament.status == TournamentStatus.PendingComputation, "Not pending");
        require(players.length == scores.length, "Mismatched arrays");
        require(winners.length == prizes.length, "Mismatched prizes");

        PublishedResults storage results = tournamentResults[tournamentId];
        require(!results.isPublished, "Already published");

        for (uint256 i = 0; i < players.length; i++) {
            results.scores[players[i]] = scores[i];
        }

        results.winners = winners;
        results.prizes = prizes;
        results.isPublished = true;

        currentTournament.status = TournamentStatus.ResultsPublished;

        emit ResultsPublished(tournamentId, winners, prizes);

        _distributePrizes(tournamentId);
    }

    function _distributePrizes(uint256 tournamentId) private {
        PublishedResults storage results = tournamentResults[tournamentId];
        
        for (uint256 i = 0; i < results.winners.length; i++) {
            payable(results.winners[i]).transfer(results.prizes[i]);
        }

        currentTournament.status = TournamentStatus.Finished;
        tournaments[tournamentId] = currentTournament;

        emit TournamentFinished(tournamentId);

        _prepareNextTournament();
    }

    function _prepareNextTournament() private {
        unchecked {
            ++currentTournamentId;
        }
        
        currentTournament = TournamentInfo({
            tournamentId: currentTournamentId,
            status: TournamentStatus.Registration,
            startTime: 0,
            playerCount: 0,
            totalGames: 0,
            rounds: DEFAULT_ROUNDS,
            prizePool: 0
        });

        emit TournamentCreated(currentTournamentId);
    }

    function _validateRuleStructure(ConditionSubject subject, ConditionOperator operator) private pure {
        if (subject == ConditionSubject.MyLastMove || subject == ConditionSubject.OpponentLastMove) {
            require(operator == ConditionOperator.Is || operator == ConditionOperator.IsNot, "Invalid operator for move subject");
        } else {
            require(operator == ConditionOperator.Equals || operator == ConditionOperator.GreaterThan || operator == ConditionOperator.LessThan, "Invalid operator for numeric subject");
        }
    }

    function getTournamentInfo() external view returns (TournamentInfo memory) {
        return currentTournament;
    }

    function getTournament(uint256 tournamentId) external view returns (TournamentInfo memory) {
        if (tournamentId == currentTournamentId) {
            return currentTournament;
        }
        return tournaments[tournamentId];
    }

    function getTournamentPlayers(uint256 tournamentId) external view returns (address[] memory) {
        return tournamentPlayers[tournamentId];
    }

    function getPlayerScore(uint256 tournamentId, address player) external view returns (uint256) {
        require(tournamentResults[tournamentId].isPublished, "Results not published yet");
        return tournamentResults[tournamentId].scores[player];
    }

    function getTournamentWinners(uint256 tournamentId) external view returns (address[] memory, uint256[] memory) {
        require(tournamentResults[tournamentId].isPublished, "Results not published yet");
        PublishedResults storage results = tournamentResults[tournamentId];
        return (results.winners, results.prizes);
    }

    function getVoteInfo(uint256 tournamentId) external view returns (uint256 voteCount, uint256 requiredVotes) {
        VoteInfo storage votes = tournamentVotes[tournamentId];
        return (votes.voteCount, votes.requiredVotes);
    }

    function hasVoted(uint256 tournamentId, address player) external view returns (bool) {
        return tournamentVotes[tournamentId].hasVoted[player];
    }

    function getStrategy(address player) external view returns (
        ConditionSubject[] memory subjects,
        ConditionOperator[] memory operators,
        uint256[] memory values,
        bool isSubmitted
    ) {
        EncryptedStrategy storage strategy = encryptedStrategies[currentTournamentId][player];
        uint256 rulesLength = strategy.rules.length;

        subjects = new ConditionSubject[](rulesLength);
        operators = new ConditionOperator[](rulesLength);
        values = new uint256[](rulesLength);

        for (uint256 i = 0; i < rulesLength; i++) {
            Rule storage rule = strategy.rules[i];
            subjects[i] = rule.subject;
            operators[i] = rule.operator;
            values[i] = rule.value;
        }

        isSubmitted = strategy.isSubmitted;
    }

    function getEncryptedStrategyForComputation(address player) external view onlyOracle returns (
        uint256 encryptedActions,
        ConditionSubject[] memory subjects,
        ConditionOperator[] memory operators,
        uint256[] memory values
    ) {
        EncryptedStrategy storage strategy = encryptedStrategies[currentTournamentId][player];
        require(strategy.isSubmitted, "No strategy submitted");
        
        uint256 rulesLength = strategy.rules.length;
        subjects = new ConditionSubject[](rulesLength);
        operators = new ConditionOperator[](rulesLength);
        values = new uint256[](rulesLength);
        
        for (uint256 i = 0; i < rulesLength; i++) {
            subjects[i] = strategy.rules[i].subject;
            operators[i] = strategy.rules[i].operator;
            values[i] = strategy.rules[i].value;
        }
        
        encryptedActions = strategy.encryptedActions;
    }

    receive() external payable {}
}
