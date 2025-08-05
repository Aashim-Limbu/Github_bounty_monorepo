// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0 <0.9.0;

import {IEntryPoint} from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import {Wallet} from "./Wallet.sol";
import {Create2} from "@openzeppelin-contracts/contracts/utils/Create2.sol";
import {ERC1967Proxy} from "@openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title Wallet Factory
 * @author Aashim Limbu
 * @notice This deploys the EIP1967Proxy Contract that have their own storage while the implementation remains the same
 */
contract WalletFactory {
    Wallet public immutable i_walletImplementation;

    constructor(IEntryPoint _entryPoint) {
        i_walletImplementation = new Wallet(_entryPoint, address(this));
    }

    //Get the Deterministic Address for the Proxy Wallet.
    // This create2 Address can hold the token by themselves without being deployed.
    function getAddress(address owner, uint256 salt) public view returns (address) {
        bytes memory walletInit = abi.encodeCall(Wallet.initialize, owner);
        bytes memory proxyConstructor = abi.encode(address(i_walletImplementation), walletInit);
        bytes memory bytecode = abi.encodePacked(type(ERC1967Proxy).creationCode, proxyConstructor); //_creation_code
        bytes32 bytecodeHash = keccak256(bytecode);
        // You must pass creationCode + constructor args to keccak256() for CREATE2. That is how EVM determines to deployed contract address.
        return Create2.computeAddress(bytes32(salt), bytecodeHash);
    }
    // To deploy them we send the initCode in the UserOperation to Bundler
    function createAccount(address _owner, uint256 salt) external returns (Wallet) {
        address addr = getAddress(_owner, salt);
        uint256 codeSize = addr.code.length;
        // whether a contract has been deployed at a specific address
        if (codeSize > 0) {
            return Wallet(payable(addr));
        }
        bytes memory walletInit = abi.encodeCall(Wallet.initialize, _owner);
        ERC1967Proxy proxy = new ERC1967Proxy{salt: bytes32(salt)}(address(i_walletImplementation), walletInit);
        return Wallet(payable(address(proxy)));
    }
}
