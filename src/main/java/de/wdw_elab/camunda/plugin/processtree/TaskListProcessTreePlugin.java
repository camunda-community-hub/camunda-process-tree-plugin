package de.wdw_elab.camunda.plugin.processtree;

import java.util.HashSet;
import java.util.Set;

import org.camunda.bpm.tasklist.plugin.spi.impl.AbstractTasklistPlugin;

import de.wdw_elab.camunda.plugin.processtree.resources.TaskListProcessTreePluginRootResource;

public class TaskListProcessTreePlugin extends AbstractTasklistPlugin {

	public static final String ID = "process-tree-plugin";

	public String getId() {
		return ID;
	}

	@Override
	public Set<Class<?>> getResourceClasses() {
		Set<Class<?>> classes = new HashSet<Class<?>>();

		classes.add(TaskListProcessTreePluginRootResource.class);

		return classes;
	}

	@Override
	public String getAssetDirectory() {
		return "plugin-webapp/cockpit-plugin";
	}
}
