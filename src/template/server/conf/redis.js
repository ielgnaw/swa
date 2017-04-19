/**
 * @file redis 默认配置
 *       @see https://www.npmjs.com/package/redis#options-object-properties
 * @author ielgnaw(wuji0223@gmail.com)
 */

export default {
    host: '127.0.0.1',
    port: 6379,
    path: null,
    url: null,
    string_numbers: null,
    return_buffers: false,
    detect_buffers: false,
    socket_keepalive: true,
    no_ready_check: false,
    enable_offline_queue: true,
    retry_max_delay: null,
    connect_timeout: 3600000,
    max_attempts: 0,
    retry_unfulfilled_commands: false,
    password: null,
    db: null,
    family: 'IPv4',
    disable_resubscribing: false,
    rename_commands: null,
    tls: null,
    prefix: null,
    retry_strategy: () => {}
};
