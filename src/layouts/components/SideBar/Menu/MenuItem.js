import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import { NavLink } from 'react-router-dom';
import styles from './Menu.module.scss';
import Image from '~/components/Image';

const cx = classNames.bind(styles);

function MenuItem({ title, to, icon, activeIcon, className }) {
    return (
        <NavLink
            //nếu nav.isActive = true thì nó sẽ thêm class active vào
            className={nav =>
                cx('menu-item', {
                    active: nav.isActive,
                    [className]: className
                })
            }
            to={to}
        >
            <span className={cx('icon')}>{icon}</span>
            <span className={cx('active-icon')}>{activeIcon}</span>

            <span className={cx('title')}>{title}</span>
        </NavLink>
    );
}

MenuItem.propTypes = {
    title: PropTypes.string.isRequired,
    to: PropTypes.string.isRequired,
    icon: PropTypes.node.isRequired
};

export default MenuItem;
