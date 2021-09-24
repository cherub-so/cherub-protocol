import 'antd/dist/antd.css';
import './App.css';

import { Alert, Button, Card, Col, Dropdown, Input, Layout, Menu, Radio, Row, Select, Slider, Steps, Typography, message } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { Program, Provider, web3 } from '@project-serum/anchor';
import { useState, useEffect, useCallback } from 'react';
import { useWallet, WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { getPhantomWallet } from '@solana/wallet-adapter-wallets';
import { Connection, PublicKey } from '@solana/web3.js';

import idl from './idl.json';

const { Content, Footer, Header } = Layout;
const { Option } = Select;
const { Step } = Steps;
const { Title } = Typography;
const { SystemProgram, Keypair } = web3;

const wallets = [getPhantomWallet()]
const baseAccount = Keypair.generate();
const opts = { preflightCommitment: 'processed' };
const programID = new PublicKey(idl.metadata.address);

const tradeSteps = [
  {
    title: 'Set Amount',
    content: 'Your order amount.',
  },
  {
    title: 'Set Collateral',
    content: 'Leverage determines the required amount.',
  },
  {
    title: 'Place Order',
    content: 'This will be instantly filled.',
  },
];

const poolSteps = [
  {
    title: 'Set Amount',
    content: 'Your deposit amount.',
  },
  {
    title: 'Review',
    content: 'Your deposit will earn 12% APY and you will receive 12 C tokens.',
  },
  {
    title: 'Deposit',
    content: 'Your deposit will be locked for 5 days',
  },
];

const selectBeforeFrom = (
  <Select defaultValue='SOL' className='select-before'>
    <Option value='SOL'>SOL</Option>
  </Select>
);

const selectBeforeTo = (
  <Select defaultValue='BTC' className='select-before'>
    <Option value='BTC'>BTC</Option>
    <Option value='ETH'>ETH</Option>
  </Select>
);

const tradeOptions = [
  { label: 'Buy / Long', value: 'long' },
  { label: 'Sell / Short', value: 'short' },
];

const lamportsPerSol = 10000000;
const network = 'http://127.0.0.1:8899';

function App() {
  const [menu, setMenu] = useState('trade');
  const [tradeStep, setTradeStep] = useState(0);
  const [poolStep, setPoolStep] = useState(0);
  const [tradeDirection, setTradeDirection] = useState('long');
  const [leverage, setLeverage] = useState(1);
  const [balance, setBalance] = useState(0);
  const [blockHeight, setBlockHeight] = useState(0);
  const [blockHeightInterval, setBlockHeightInterval] = useState(false);

  const wallet = useWallet()

  const getProviderCallback = useCallback(getProvider, [getProvider]);

  const settingsMenu = (
    <Menu onClick={handleSettingsClick}>
      <Menu.Item key='Light mode'>
        Dark mode
      </Menu.Item>
      <Menu.Item key='Dark mode'>
        Light mode
      </Menu.Item>
    </Menu>
  );

  async function getProvider() {
    const connection = new Connection(network, opts.preflightCommitment);
    return new Provider(connection, wallet, opts.preflightCommitment);
  }

  async function initialize() {
    const provider = await getProvider();
    const program = new Program(idl, programID, provider);
    try {
      await program.rpc.initialize('Hello World', {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });

      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
      console.log('account: ', account);
    } catch (err) {
      console.log('Transaction error: ', err);
    }
  }

  async function handleMenuClick(e) {
    setMenu(e.key);
  }

  async function onConnectWalletClick(e) {
    document.getElementsByClassName('WalletMultiButton')[0].click();
  }

  async function onLearnMoreClick(e) {
    window.open('https://www.github.com/xv01-finance', '_blank');
  }

  async function onTradeOptionsChange(e) {
    setTradeDirection(e.target.value);
  }

  async function onAfterLeverageChange(e) {
    setLeverage(e);
  }

  function handleSettingsClick(e) {
    message.info(e.key);
  }

  useEffect(() => {
    if (wallet.connected && !blockHeightInterval) {
      setBlockHeightInterval(true);
      getProviderCallback().then(function(provider) {
        provider.connection.getBalance(wallet.publicKey).then(function(result) {
          setBalance(result / lamportsPerSol);
        });
        setInterval(function () {
          provider.connection.getEpochInfo().then(function(epochInfo) {
            setBlockHeight(epochInfo.blockHeight);
          });
        }, 1000);
      });
    }
  }, [wallet.connected, wallet.publicKey, blockHeightInterval, getProviderCallback]);

  return (
    <Layout className='App Dark'>
      <Alert type='warning' className='Dark' closable
        message='You are currently using an unaudited piece of software. Use at your own risk.' banner/>
      <Header className='Header Dark'>
        <Row>
          <Col span={3}>
            <div className='Logo Dark'><strong>xv01.fi</strong></div>
          </Col>
          <Col span={13}>
            <Menu className='Menu Dark' onClick={handleMenuClick} selectedKeys={[menu]} mode='horizontal'>
              <Menu.Item key='trade'>Trade</Menu.Item>
              <Menu.Item key='pool'>Pool</Menu.Item>
              <Menu.Item key='charts'>Charts</Menu.Item>
            </Menu>
          </Col>
          <Col span={8} className='ConnectWalletHeader'>
            { !wallet.connected ?
            <>
              <WalletMultiButton className='WalletMultiButton'/>
              <Dropdown.Button className='ConnectWalletButton'
                icon={<SettingOutlined/>} onClick={onConnectWalletClick} type='link' overlay={settingsMenu}>
                Connect Wallet
              </Dropdown.Button>
            </> :
            <div className='Connected'>
              <code>{wallet.publicKey.toString().substr(0, 4)}...{wallet.publicKey.toString().substr(-4)}</code>
            </div>
            }
          </Col>
        </Row>
      </Header>
      <Layout className='Layout Dark'>
        <Content>
          <div>
            <br/>
            <br/>
            { !wallet.connected ? <Title className='Title Dark'>Perpetual futures vAMM and yield-based XV01 pooling protocol</Title> : '' }
            { !wallet.connected ? (
              <>
                <Row>
                  <Col span={12}>
                    <Button className='ConnectWallet' onClick={onConnectWalletClick} type='primary' size='large'>Connect Wallet</Button>
                  </Col>
                  <Col span={12}>
                    <Button className='LearnMore Dark' onClick={onLearnMoreClick} ghost size='large'>Learn More</Button>
                  </Col>
                </Row>
              </>
            ) : <Title className='Title Dark Balance' level={2}>Balance: {balance} SOL</Title> }
            <br/>
            <br/>
            { menu === 'trade'&& wallet.connected ? (
              <Row>
                <Col span={6}></Col>
                <Col span={8} className='Cards'>
                  <div className='site-card-border-less-wrapper'>
                    <Card title='Trade' className='Card Dark' bordered={false}>
                      <p><strong>Amount</strong></p>
                      <Input className='TradeInput Input Dark' addonBefore={selectBeforeFrom} defaultValue='0' />
                      <br/>
                      <p>Your current balance is <strong>{balance}</strong></p>
                      <p><strong>Collateral</strong></p>
                      <Input className='TradeInput Input Dark' addonBefore={selectBeforeTo} defaultValue='0' />
                      <br/>
                      <br/>
                      <Radio.Group options={tradeOptions} onChange={onTradeOptionsChange} className='RadioGroup Dark'
                        optionType='button' buttonStyle='solid' value={tradeDirection} />
                      <br/>
                      <br/>
                      <p><strong>{ leverage }x Leverage</strong></p>
                      <Slider defaultValue={1} min={1} onAfterChange={onAfterLeverageChange} />
                      <br/>
                      <Button size='large' disabled={!wallet.connected} className='TradeButton Button Dark' type='ghost'>Approve</Button>
                    </Card>
                  </div>
                </Col>
                <Col span={1}></Col>
                <Col span={3}>
                  <Steps direction='vertical' current={tradeStep}>
                    { tradeSteps.map(item => (<Step key={item.title} title={item.title} description={item.content} />)) }
                  </Steps> : '' }
                </Col>
                <Col span={6}></Col>
              </Row>
            ) : '' }
            { menu === 'pool' && wallet.connected ? (
              <Row>
                <Col span={6}></Col>
                <Col span={4}>
                  <Steps direction='vertical' current={poolStep}>
                    { poolSteps.map(item => (<Step key={item.title} title={item.title} description={item.content} />)) }
                  </Steps> : '' }
                </Col>
                <Col span={1}></Col>
                <Col span={8} className='Cards'>
                  <div className='site-card-border-less-wrapper'>
                    <Card className='Card Dark' title='Pool' bordered={false}>
                      <Input className='PoolInput Input Dark' addonBefore={selectBeforeFrom} defaultValue='0' />
                      <br/>
                      <p>Your current balance is <strong>{balance}</strong></p>
                      <Button size='large' disabled={!wallet.connected} className='ApproveButton Button Dark' type='ghost'>Approve</Button>
                    </Card>
                  </div>
                </Col>
                <Col span={6}></Col>
              </Row>
            ) : '' }
            { menu === 'charts' && wallet.connected ? (
              <Row>
                <Col span={2}></Col>
                <Col span={20} className='Cards'>
                  <div className='site-card-border-less-wrapper'>
                    <Card className='Card Dark' title='Charts' bordered={false}>
                      <p>Coming soon!</p>
                    </Card>
                  </div>
                </Col>
                <Col span={2}></Col>
              </Row>
            ) : '' }
          </div>
        </Content>
      </Layout>
      <Footer className='Footer'><code className='CurrentBlock'><small>• {blockHeight}</small></code></Footer>
    </Layout>
  );
}

const AppWithProvider = () => (
  <ConnectionProvider endpoint={network}>
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <App/>
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
)

export default AppWithProvider;
