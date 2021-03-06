import React, { useState } from 'react';
import { Row, Col, Form, Radio, Select, Input, InputNumber, Button, Popconfirm } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import { useModel } from '@tarocch1/use-model';
import CodeMirror from './CodeMirror';
import { MainModel } from '../../models';
import { ProxyMode, ProxyScheme, IProxyFormData } from '../../types';
import { DEFAULT_PROXY_FORMDATA } from '../../utils/constants';

function Edit() {
  const mainModel = useModel(MainModel);
  const [proxyMode, setProxyMode] = useState<ProxyMode>(mainModel.edittingProxy.mode);
  const [proxyScheme, setProxyScheme] = useState<ProxyScheme>(mainModel.edittingProxy.scheme);
  const [form] = Form.useForm();
  const onValuesChange = (changedValues: any) => {
    if (changedValues.mode) setProxyMode(changedValues.mode);
    if (changedValues.scheme) setProxyScheme(changedValues.scheme);
  };
  const onDelete = () => {
    mainModel.deleteProxy(mainModel.edittingProxy.id);
    mainModel.resetEdittingProxy();
    mainModel.setShowMode('list');
  };
  const onCancel = () => {
    mainModel.resetEdittingProxy();
    mainModel.setShowMode('list');
  };
  const onFinish = (values: any) => {
    const data: IProxyFormData = {
      ...DEFAULT_PROXY_FORMDATA,
      ...values,
    };
    data.id = mainModel.edittingProxy.id || uuidv4();
    if (mainModel.edittingProxy.id) {
      mainModel.editProxy(data);
    } else {
      mainModel.createProxy(data);
    }
    mainModel.setShowMode('list');
  };
  return (
    <Form
      id="edit-form"
      style={{ padding: '8px 16px 16px' }}
      form={form}
      layout="vertical"
      initialValues={mainModel.edittingProxy}
      onValuesChange={onValuesChange}
      onFinish={onFinish}
      hideRequiredMark
    >
      <Form.Item label={chrome.i18n.getMessage('proxy_name')} name="name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item
        label={chrome.i18n.getMessage('proxy_mode')}
        name="mode"
        extra={
          proxyMode === 'direct' ? (
            <span style={{ display: 'inline-block', margin: '4px 0' }}>{chrome.i18n.getMessage('direct_extra')}</span>
          ) : null
        }
      >
        <Radio.Group buttonStyle="solid">
          <Radio.Button value="fixed_servers">{chrome.i18n.getMessage('manual')}</Radio.Button>
          <Radio.Button value="pac_script">{chrome.i18n.getMessage('auto')}</Radio.Button>
          <Radio.Button value="direct">{chrome.i18n.getMessage('direct')}</Radio.Button>
        </Radio.Group>
      </Form.Item>
      {proxyMode === 'fixed_servers' && (
        <React.Fragment>
          <Form.Item label={chrome.i18n.getMessage('proxy_scheme')} name="scheme" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="http">HTTP</Select.Option>
              <Select.Option value="https">HTTPS</Select.Option>
              <Select.Option value="socks4">Socks4</Select.Option>
              <Select.Option value="socks5">Socks5</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Input.Group compact>
              <Form.Item
                style={{ marginBottom: 0, width: '66.7%' }}
                name="host"
                label={chrome.i18n.getMessage('proxy_host')}
                rules={[{ required: true }]}
              >
                <Input placeholder="e.g. 127.0.0.1" />
              </Form.Item>
              <Form.Item
                style={{ marginBottom: 0, width: '33.3%' }}
                name="port"
                label={chrome.i18n.getMessage('proxy_port')}
                rules={[{ required: true }]}
              >
                <InputNumber placeholder="e.g. 8080" min={1} max={65535} />
              </Form.Item>
            </Input.Group>
          </Form.Item>
          {proxyScheme.includes('http') && (
            <Form.Item>
              <Input.Group compact>
                <Form.Item
                  style={{ marginBottom: 0, width: '50%' }}
                  name="username"
                  label={chrome.i18n.getMessage('proxy_username')}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  style={{ marginBottom: 0, width: '50%' }}
                  name="password"
                  label={chrome.i18n.getMessage('proxy_password')}
                >
                  <Input.Password />
                </Form.Item>
              </Input.Group>
            </Form.Item>
          )}
          <Form.Item
            label={chrome.i18n.getMessage('bypass_list')}
            extra={
              <span>
                {chrome.i18n.getMessage('bypass_list_extra')}
                <a
                  onClick={() => {
                    chrome.tabs.create({ url: 'https://developer.chrome.com/extensions/proxy#bypass_list' });
                  }}
                >
                  {chrome.i18n.getMessage('bypass_list_extra_example')}
                </a>
              </span>
            }
            name="bypassList"
          >
            <CodeMirror
              options={{
                mode: null,
                placeholder: 'e.g. <local>',
              }}
            />
          </Form.Item>
        </React.Fragment>
      )}
      {proxyMode === 'pac_script' && (
        <React.Fragment>
          <Form.Item
            label={chrome.i18n.getMessage('pac_file')}
            name="pacUrl"
            normalize={value => {
              setTimeout(() => form.validateFields(['pacScript']), 0);
              return value;
            }}
            rules={[
              ({ getFieldValue }) => ({
                validator(rule, value) {
                  if (getFieldValue('pacScript') || value) return Promise.resolve();
                  return Promise.reject('error');
                },
              }),
            ]}
          >
            <Input placeholder="e.g. http://127.0.0.1:1080/pac" />
          </Form.Item>
          <Form.Item
            label={chrome.i18n.getMessage('pac_script')}
            extra={chrome.i18n.getMessage('pac_script_extra')}
            name="pacScript"
            normalize={value => {
              setTimeout(() => form.validateFields(['pacUrl']), 0);
              return value;
            }}
            rules={[
              ({ getFieldValue }) => ({
                validator(rule, value) {
                  if (getFieldValue('pacUrl') || value) return Promise.resolve();
                  return Promise.reject('error');
                },
              }),
            ]}
          >
            <CodeMirror
              options={{
                mode: 'javascript',
              }}
            />
          </Form.Item>
        </React.Fragment>
      )}
      <Row justify="space-between">
        <Col>
          {mainModel.edittingProxy.id !== '' && (
            <Popconfirm
              arrowPointAtCenter
              placement="topLeft"
              title={chrome.i18n.getMessage('delete_confirm')}
              okText={chrome.i18n.getMessage('confirm')}
              cancelText={chrome.i18n.getMessage('cancel')}
              onConfirm={onDelete}
            >
              <Button danger>{chrome.i18n.getMessage('delete')}</Button>
            </Popconfirm>
          )}
        </Col>
        <Col style={{ flexGrow: 0 }}>
          <Button style={{ marginRight: 8 }} onClick={onCancel}>
            {chrome.i18n.getMessage('cancel')}
          </Button>
          <Button type="primary" htmlType="submit">
            {chrome.i18n.getMessage(mainModel.edittingProxy.id !== '' ? 'save' : 'create')}
          </Button>
        </Col>
      </Row>
    </Form>
  );
}

export default Edit;
